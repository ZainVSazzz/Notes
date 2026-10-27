import { masterModel } from './model.js';

export async function getCabang(req, res, next) {
  try {
    const data = await masterModel.getCabang();

    return res.status(200).json({
      status: true,
      message: 'Data cabang berhasil diambil',
      data: data.map((item) => ({
        kodeCab: item.kode_cab,
        namaCab: item.nama_cab,
        label: `${item.kode_cab} - ${item.nama_cab}`
      }))
    });
  } catch (error) {
    next(error);
  }
}