import http from "@/shared/api/http";

export async function getCabang() {
  const response = await http.get("/cabang");
  return response.data.data;
}
