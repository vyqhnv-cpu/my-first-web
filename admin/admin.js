document.addEventListener('DOMContentLoaded', () => {
  const apiBase = '/api';
  
  // State variables to map IDs to Names for Orders
  let productsCache = [];
  let customersCache = [];
  
  // DOM Elements
  const tabButtons = document.querySelectorAll('.nav-item');
  const panels = document.querySelectorAll('.tab-panel');
  const btnAddNew = document.getElementById('btn-add-new');
  const pageTitle = document.getElementById('page-title');
  const pageDesc = document.getElementById('page-desc');
  
  // Modal Elements
  const formModal = document.getElementById('form-modal');
  const modalTitle = document.getElementById('modal-title');
  const entityForm = document.getElementById('entity-form');
  const modalFieldsContainer = document.getElementById('modal-fields-container');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnCancelModal = document.getElementById('btn-cancel-modal');
  
  // Toast Elements
  const toast = document.getElementById('toast-message');

  // Track active tab & operation status
  let activeTab = 'products';
  let isEditing = false;
  let editId = null;

  // Configuration for each Tab
  const config = {
    products: {
      title: 'Quản Lý Gói Ủng Hộ',
      desc: 'Xem, chỉnh sửa, thêm và xóa thông tin các gói ủng hộ (Donation).',
      tableBodyId: 'products-table-body',
      fields: [
        { name: 'name', label: 'Tên gói ủng hộ', type: 'text', required: true },
        { name: 'price', label: 'Giá trị ủng hộ (VNĐ)', type: 'number', required: true },
        { name: 'description', label: 'Mô tả ý nghĩa gói', type: 'textarea', required: false },
        { name: 'stock', label: 'Số lượt khả dụng tối đa', type: 'number', required: true, defaultValue: '999999' }
      ]
    },
    customers: {
      title: 'Danh Sách Khách Hàng',
      desc: 'Quản lý thông tin nhà hảo tâm, khách hàng đăng ký tư vấn và kiểm tra.',
      tableBodyId: 'customers-table-body',
      fields: [
        { name: 'full_name', label: 'Họ và Tên', type: 'text', required: true },
        { name: 'phone', label: 'Số điện thoại', type: 'tel', required: true },
        { name: 'email', label: 'Email', type: 'email', required: false },
        { name: 'zalo', label: 'Link Zalo / Facebook / Ghi chú', type: 'text', required: false }
      ]
    },
    orders: {
      title: 'Danh Sách Đơn Hàng / Lượt Ủng Hộ',
      desc: 'Quản lý lượt ủng hộ. Thêm lượt ủng hộ mới sẽ tự động trừ số lượt khả dụng tương ứng.',
      tableBodyId: 'orders-table-body',
      fields: [
        { name: 'customer_id', label: 'Chọn người ủng hộ', type: 'select_customer', required: true },
        { name: 'product_id', label: 'Chọn gói ủng hộ', type: 'select_product', required: true },
        { name: 'amount', label: 'Số tiền ủng hộ', type: 'number', required: true },
        { name: 'status', label: 'Trạng thái giao dịch', type: 'select', required: true, options: [
          { value: 'pending', label: 'Đang xử lý (Pending)' },
          { value: 'completed', label: 'Hoàn thành (Completed)' },
          { value: 'cancelled', label: 'Đã hủy (Cancelled)' }
        ]}
      ]
    }
  };

  // Toast message utility
  function showToast(message, isError = false) {
    toast.textContent = message;
    toast.className = 'toast show' + (isError ? ' error' : '');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  }

  // Currency Formatter
  function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  }

  // Format ISO date
  function formatDate(isoString) {
    if (!isoString) return 'Chưa rõ';
    try {
      const date = new Date(isoString);
      return date.toLocaleString('vi-VN', { 
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  }

  // Tab switching logic
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      
      btn.classList.add('active');
      activeTab = btn.dataset.target;
      
      const panel = document.getElementById(activeTab);
      if (panel) panel.classList.add('active');

      // Update headers
      pageTitle.textContent = config[activeTab].title;
      pageDesc.textContent = config[activeTab].desc;

      // Special action button configuration
      if (activeTab === 'orders') {
        // Disable edit for orders if wanted, but delete is enabled
      }

      loadData();
    });
  });

  // Load and refresh cache and render tables
  async function loadData() {
    try {
      // Always fetch latest products and customers for reference in orders
      const [prodRes, custRes] = await Promise.all([
        fetch(`${apiBase}/products`),
        fetch(`${apiBase}/customers`)
      ]);
      
      if (prodRes.ok) productsCache = await prodRes.json();
      if (custRes.ok) customersCache = await custRes.json();
      
      if (activeTab === 'products') {
        renderProducts();
      } else if (activeTab === 'customers') {
        renderCustomers();
      } else if (activeTab === 'orders') {
        renderOrders();
      }
    } catch (error) {
      console.error('Error loading API data:', error);
      showToast('Không thể kết nối đến server backend!', true);
    }
  }

  // RENDER PRODUCTS TABLE
  function renderProducts() {
    const tbody = document.getElementById(config.products.tableBodyId);
    tbody.innerHTML = '';
    
    if (productsCache.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Chưa có sản phẩm nào. Nhấp "+ Thêm Mới" để bắt đầu.</td></tr>`;
      return;
    }
    
    productsCache.forEach(prod => {
      const tr = document.createElement('tr');
      
      let stockClass = 'in-stock';
      if (prod.stock <= 0) stockClass = 'out-of-stock';
      else if (prod.stock <= 5) stockClass = 'low-stock';

      const stockLabel = prod.stock <= 0 ? 'Hết lượt' : `${prod.stock} lượt`;

      tr.innerHTML = `
        <td>${prod.id}</td>
        <td><strong>${prod.name}</strong></td>
        <td>${formatCurrency(prod.price)}</td>
        <td>${prod.description || '<span class="text-muted">Không có mô tả</span>'}</td>
        <td><span class="stock-badge ${stockClass}">${stockLabel}</span></td>
        <td class="actions-col">
          <button class="btn-action-edit" data-id="${prod.id}">Sửa</button>
          <button class="btn-action-delete" data-id="${prod.id}">Xóa</button>
        </td>
      `;
      
      // Bind event listeners
      tr.querySelector('.btn-action-edit').addEventListener('click', () => openEditModal('products', prod));
      tr.querySelector('.btn-action-delete').addEventListener('click', () => deleteEntity('products', prod.id, prod.name));
      
      tbody.appendChild(tr);
    });
  }

  // RENDER CUSTOMERS TABLE
  function renderCustomers() {
    const tbody = document.getElementById(config.customers.tableBodyId);
    tbody.innerHTML = '';
    
    if (customersCache.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Danh sách khách hàng đang trống.</td></tr>`;
      return;
    }
    
    customersCache.forEach(cust => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${cust.id}</td>
        <td><strong>${cust.full_name}</strong></td>
        <td>${cust.phone}</td>
        <td>${cust.email || '<span class="text-muted">Không có</span>'}</td>
        <td>${cust.zalo || '<span class="text-muted">Không có</span>'}</td>
        <td>${formatDate(cust.registered_at)}</td>
        <td class="actions-col">
          <button class="btn-action-edit" data-id="${cust.id}">Sửa</button>
          <button class="btn-action-delete" data-id="${cust.id}">Xóa</button>
        </td>
      `;
      
      // Bind event listeners
      tr.querySelector('.btn-action-edit').addEventListener('click', () => openEditModal('customers', cust));
      tr.querySelector('.btn-action-delete').addEventListener('click', () => deleteEntity('customers', cust.id, cust.full_name));
      
      tbody.appendChild(tr);
    });
  }

  // RENDER ORDERS TABLE
  async function renderOrders() {
    const tbody = document.getElementById(config.orders.tableBodyId);
    tbody.innerHTML = '';
    
    try {
      const res = await fetch(`${apiBase}/orders`);
      if (!res.ok) throw new Error('Failed to fetch orders');
      const orders = await res.json();
      
      if (orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Chưa có đơn hàng nào được ghi nhận.</td></tr>`;
        return;
      }

      // Map to help find names
      const productMap = new Map(productsCache.map(p => [p.id, p.name]));
      const customerMap = new Map(customersCache.map(c => [c.id, `${c.full_name} (${c.phone})`]));

      orders.forEach(order => {
        const customerName = customerMap.get(order.customer_id) || `Người ủng hộ #${order.customer_id}`;
        const productName = productMap.get(order.product_id) || `Gói ủng hộ #${order.product_id}`;
        
        let statusClass = 'pending';
        let statusLabel = 'Đang xử lý';
        if (order.status === 'completed') {
          statusClass = 'completed';
          statusLabel = 'Hoàn thành';
        } else if (order.status === 'cancelled') {
          statusClass = 'cancelled';
          statusLabel = 'Đã hủy';
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${order.id}</td>
          <td><strong>${customerName}</strong></td>
          <td>${productName}</td>
          <td>${formatCurrency(order.amount)}</td>
          <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
          <td>${formatDate(order.order_date)}</td>
          <td class="actions-col">
            <button class="btn-action-edit" data-id="${order.id}">Sửa</button>
            <button class="btn-action-delete" data-id="${order.id}">Xóa</button>
          </td>
        `;
        
        // Bind events
        tr.querySelector('.btn-action-edit').addEventListener('click', () => openEditModal('orders', order));
        tr.querySelector('.btn-action-delete').addEventListener('click', () => deleteEntity('orders', order.id, `Đơn hàng #${order.id}`));
        
        tbody.appendChild(tr);
      });
    } catch (e) {
      console.error(e);
      tbody.innerHTML = `<tr><td colspan="7" class="empty-state error">Lỗi tải danh sách đơn hàng.</td></tr>`;
    }
  }

  // BUILD AND OPEN FORM MODAL
  function openAddModal() {
    isEditing = false;
    editId = null;
    modalTitle.textContent = `Thêm ${config[activeTab].title.replace('Quản Lý ', '').replace('Danh Sách ', '')} Mới`;
    
    // Clear and build form
    buildFormFields(activeTab);
    formModal.classList.add('open');
  }

  function openEditModal(type, data) {
    isEditing = true;
    editId = data.id;
    modalTitle.textContent = `Chỉnh Sửa ${config[type].title.replace('Quản Lý ', '').replace('Danh Sách ', '')} #${data.id}`;
    
    buildFormFields(type, data);
    formModal.classList.add('open');
  }

  function closeModal() {
    formModal.classList.remove('open');
    entityForm.reset();
  }

  btnCloseModal.addEventListener('click', closeModal);
  btnCancelModal.addEventListener('click', closeModal);
  btnAddNew.addEventListener('click', openAddModal);

  // BUILD DYNAMIC FIELDS BASED ON CONFIG
  function buildFormFields(tabType, populateData = null) {
    modalFieldsContainer.innerHTML = '';
    const fields = config[tabType].fields;

    fields.forEach(field => {
      const group = document.createElement('div');
      group.className = 'form-group';
      
      const label = document.createElement('label');
      label.textContent = field.label + (field.required ? ' *' : '');
      group.appendChild(label);

      let input;
      const val = populateData ? populateData[field.name] : (field.defaultValue || '');

      if (field.type === 'textarea') {
        input = document.createElement('textarea');
        input.className = 'form-control';
        input.name = field.name;
        input.value = val;
        if (field.required) input.required = true;
      } 
      else if (field.type === 'select') {
        input = document.createElement('select');
        input.className = 'form-control';
        input.name = field.name;
        if (field.required) input.required = true;
        
        field.options.forEach(opt => {
          const option = document.createElement('option');
          option.value = opt.value;
          option.textContent = opt.label;
          if (opt.value === val) option.selected = true;
          input.appendChild(option);
        });
      } 
      else if (field.type === 'select_customer') {
        input = document.createElement('select');
        input.className = 'form-control';
        input.name = field.name;
        if (field.required) input.required = true;

        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = '-- Chọn khách hàng --';
        input.appendChild(defaultOpt);

        customersCache.forEach(cust => {
          const option = document.createElement('option');
          option.value = cust.id;
          option.textContent = `${cust.full_name} (${cust.phone})`;
          if (cust.id.toString() === val.toString()) option.selected = true;
          input.appendChild(option);
        });
      } 
      else if (field.type === 'select_product') {
        input = document.createElement('select');
        input.className = 'form-control';
        input.name = field.name;
        input.id = 'field-product-id';
        if (field.required) input.required = true;

        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = '-- Chọn gói ủng hộ --';
        input.appendChild(defaultOpt);

        productsCache.forEach(prod => {
          const option = document.createElement('option');
          option.value = prod.id;
          // Show stock information inside select
          const stockInfo = prod.stock <= 0 ? '(Hết lượt)' : `(Lượt còn lại: ${prod.stock})`;
          option.textContent = `${prod.name} - ${formatCurrency(prod.price)} ${stockInfo}`;
          if (prod.id.toString() === val.toString()) option.selected = true;
          input.appendChild(option);
        });

        // Trigger automatic amount filling when product changes
        input.addEventListener('change', (e) => {
          const selectedProdId = e.target.value;
          const matchedProd = productsCache.find(p => p.id.toString() === selectedProdId.toString());
          const amountInput = modalFieldsContainer.querySelector('input[name="amount"]');
          if (matchedProd && amountInput) {
            amountInput.value = matchedProd.price;
          }
        });
      } 
      else {
        input = document.createElement('input');
        input.type = field.type;
        input.className = 'form-control';
        input.name = field.name;
        input.value = val;
        if (field.required) input.required = true;
      }

      group.appendChild(input);
      modalFieldsContainer.appendChild(group);
    });
  }

  // FORM SUBMISSION (CREATE or UPDATE)
  entityForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Parse form values
    const formData = new FormData(entityForm);
    const payload = {};
    formData.forEach((value, key) => {
      payload[key] = value;
    });

    // Special conversions for IDs & Numbers
    if (payload.price) payload.price = parseFloat(payload.price);
    if (payload.stock) payload.stock = parseInt(payload.stock, 10);
    if (payload.amount) payload.amount = parseFloat(payload.amount);
    if (payload.customer_id) payload.customer_id = parseInt(payload.customer_id, 10);
    if (payload.product_id) payload.product_id = parseInt(payload.product_id, 10);

    // Validation for order stock when creating new order
    if (activeTab === 'orders' && !isEditing) {
      const selectedProd = productsCache.find(p => p.id === payload.product_id);
      if (selectedProd && selectedProd.stock <= 0) {
        showToast('Không thể tạo giao dịch! Gói ủng hộ này đã hết lượt khả dụng.', true);
        return;
      }
    }

    const method = isEditing ? 'PUT' : 'POST';
    const endpoint = isEditing ? `${apiBase}/${activeTab}/${editId}` : `${apiBase}/${activeTab}`;
    
    try {
      const res = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Server error');
      }

      showToast(`Đã lưu thông tin ${isEditing ? 'chỉnh sửa' : 'thêm mới'} thành công!`);
      closeModal();
      loadData();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Lỗi khi thực hiện lưu dữ liệu.', true);
    }
  });

  // DELETE ENTITY
  async function deleteEntity(type, id, displayName) {
    if (!confirm(`Bạn chắc chắn muốn xóa "${displayName}" khỏi hệ thống?`)) {
      return;
    }
    
    try {
      const res = await fetch(`${apiBase}/${type}/${id}`, {
        method: 'DELETE'
      });
      
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to delete');
      
      showToast(`Đã xóa thành công: ${displayName}`);
      loadData();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Không thể xóa phần tử này.', true);
    }
  }

  // Load Initial Data
  loadData();
});
