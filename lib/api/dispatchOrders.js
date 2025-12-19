import apiClient from "../apiClient";

export async function getDispatchOrders(params = {}) {
  const { data } = await apiClient.get("/dispatch-orders", { params });
  return data.data || data;
}

export async function getDispatchOrder(orderId) {
  const { data } = await apiClient.get(`/dispatch-orders/${orderId}`);
  return data.data || data;
}

export async function createDispatchOrder(payload) {
  const { data } = await apiClient.post("/dispatch-orders", payload);
  return data.data || data;
}

export async function uploadDispatchOrderItemImage(dispatchOrderId, itemIndex, imageFile, onProgress = null) {
  // Validate inputs
  if (!dispatchOrderId) {
    throw new Error("Dispatch order ID is required");
  }
  if (typeof itemIndex !== 'number' || itemIndex < 0) {
    throw new Error("Valid item index is required");
  }
  if (!imageFile) {
    throw new Error("Image file is required");
  }

  const formData = new FormData();
  formData.append('image', imageFile);
  
  // Verify file was appended
  if (!formData.has('image')) {
    throw new Error("Failed to append image to FormData");
  }

  try {
    const config = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };

    // Add progress callback if provided
    if (onProgress && typeof onProgress === 'function') {
      config.onUploadProgress = (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      };
    }

    const { data } = await apiClient.post(`/dispatch-orders/${dispatchOrderId}/items/${itemIndex}/image`, formData, config);
    return data.data || data;
  } catch (error) {
    throw error;
  }
}

export async function updateDispatchOrderStatus(orderId, status, payload = {}) {
  const { data } = await apiClient.patch(`/dispatch-orders/${orderId}/status`, {
    status,
    ...payload,
  });
  return data.data || data;
}

export async function generateQRCode(orderId) {
  const { data } = await apiClient.post(`/dispatch-orders/${orderId}/generate-qr`);
  return data.data || data;
}

export async function getDispatchOrderWithQRCode(orderId) {
  const { data } = await apiClient.get(`/dispatch-orders/${orderId}`);
  return data.data || data;
}

export async function updateDispatchOrder(orderId, payload) {
  const { data } = await apiClient.put(`/dispatch-orders/${orderId}`, payload);
  return data.data || data;
}

export async function deleteDispatchOrder(orderId) {
  const { data } = await apiClient.delete(`/dispatch-orders/${orderId}`);
  return data.data || data;
}

/**
 * Update dispatch order items based on returns
 * This function should be called when returns are processed to automatically
 * adjust quantities and prices in the dispatch order
 * @param {string} orderId - Dispatch order ID
 * @param {Array} returns - Array of return objects with items
 * @returns {Promise} Updated dispatch order
 */
export async function updateDispatchOrderFromReturns(orderId, returns) {
  const { data } = await apiClient.post(`/dispatch-orders/${orderId}/update-from-returns`, {
    returns
  });
  return data.data || data;
}

