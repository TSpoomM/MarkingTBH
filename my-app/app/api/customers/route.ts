import { getCustomers } from "../../services/customer.service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const rows = await getCustomers();
    return Response.json({
      data: rows.map((row) => ({ id: row.c_id, name: row.c_name })),
    });
  } catch (error) {
    console.error("GET /api/customers", error);
    return Response.json(
      { message: "เชื่อมต่อฐานข้อมูลไม่สำเร็จ กรุณาตรวจสอบ XAMPP และไฟล์ .env" },
      { status: 500 },
    );
  }
}

