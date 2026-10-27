import http from '@/shared/api/http';

function buildParams(params = {}) {
  const cleanParams = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      cleanParams[key] = value;
    }
  });

  return cleanParams;
}

export const catatanService = {
  async getPublic(params = {}) {
    const response = await http.get('/catatan/public', {
      params: buildParams(params)
    });

    return response.data.data;
  },

  async getPrivate(params = {}) {
    const response = await http.get('/catatan/my', {
      params: buildParams({
        ...params,
        status: 'private'
      })
    });

    return response.data.data;
  },

  async getTrash(params = {}) {
    const response = await http.get('/catatan/trash', {
      params: buildParams(params)
    });

    return response.data.data;
  },

  async create(payload) {
    const response = await http.post('/catatan', payload);

    return response.data.data;
  },

  async update(id, payload) {
    const response = await http.patch(`/catatan/${id}`, payload);

    return response.data.data;
  },

  async updateStatus(id, status) {
    const response = await http.patch(`/catatan/${id}/status`, {
      status
    });

    return response.data.data;
  },

  async moveToTrash(id) {
    const response = await http.patch(`/catatan/${id}/delete`);

    return response.data.data;
  },

  async restore(id) {
    const response = await http.patch(`/catatan/${id}/restore`);

    return response.data.data;
  },

  async copyIsi(id) {
    const response = await http.post(`/catatan/${id}/copy-isi`);

    return response.data.data;
  },

  async copySolusi(id) {
    const response = await http.post(`/catatan/${id}/copy-solusi`);

    return response.data.data;
  }
};
