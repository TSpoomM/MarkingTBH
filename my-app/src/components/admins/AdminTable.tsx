import { Component } from "react";
import { Pencil, Trash2 } from "lucide-react";
import Button from "@/src/components/ui/Button";
import { PANEL } from "@/src/core/ui/surfaces";
import { HISTORY_EMPTY, HISTORY_ROW, HISTORY_TABLE, HISTORY_TABLE_WRAP } from "@/src/core/ui/history";
import type { AdminTableProps } from "@/src/core/models/admin";

export default class AdminTable extends Component<AdminTableProps> {
  render() {
    const { admins, loading, onEdit, onDelete } = this.props;

    return (
      <section className={PANEL + " overflow-hidden"}>
        {loading ? (
          <div className={HISTORY_EMPTY}>Loading...</div>
        ) : admins.length === 0 ? (
          <div className={HISTORY_EMPTY}>ไม่พบรายชื่อ admin</div>
        ) : (
          <div className={HISTORY_TABLE_WRAP}>
            <table className={HISTORY_TABLE}>
              <colgroup>
                <col className="w-[25%]" />
                <col className="w-[25%]" />
                <col className="w-[25%]" />
                <col className="w-[25%]" />
              </colgroup>
              <thead>
                <tr>
                  <th>ชื่อ</th>
                  <th>role</th>
                  <th>createdDate</th>
                  <th>แก้ไข</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr className={HISTORY_ROW} key={admin.idUser || admin.fsId}>
                    <td>{admin.name}</td>
                    <td>{admin.role}</td>
                    <td>{admin.createdDate || "-"}</td>
                    <td>
                      <div className="flex justify-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="md"
                          className="min-h-[38px] px-3"
                          onClick={() => onEdit(admin)}
                        >
                          <Pencil size={15} aria-hidden="true" />
                          แก้ไข
                        </Button>
                        <Button
                          type="button"
                          variant="alert"
                          size="md"
                          className="min-h-[38px] px-3"
                          onClick={() => onDelete(admin)}
                        >
                          <Trash2 size={15} aria-hidden="true" />
                          ลบ
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    );
  }
}
