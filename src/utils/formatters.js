export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const generateInvoiceNumber = (businessName) => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `INV-${timestamp}-${random}`;
};

export const calculateTotal = (items, tax = 0, discount = 0) => {
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.quantity * item.price);
  }, 0);
  
  const taxAmount = subtotal * (tax / 100);
  const finalTotal = subtotal + taxAmount - discount;
  
  return {
    subtotal,
    taxAmount,
    discount,
    total: Math.max(0, finalTotal),
  };
};
