import http from '@/shared/api/http';

export const uploadService = {
  async uploadImage(file) {
    const formData = new FormData();

    formData.append('image', file, file.name || 'image.png');

    const response = await http.post('/uploads/image', formData);

    return response.data.data;
  }
};
