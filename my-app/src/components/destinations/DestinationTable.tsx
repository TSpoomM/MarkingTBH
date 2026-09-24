import { Component } from "react";
import { Pencil, Trash2 } from "lucide-react";
import Button from "@/src/components/ui/Button";
import { PANEL } from "@/src/core/ui/surfaces";
import { HISTORY_EMPTY, HISTORY_ROW, HISTORY_TABLE, HISTORY_TABLE_WRAP } from "@/src/core/ui/history";
import type { DestinationTableProps } from "@/src/core/models/destination";

export default class DestinationTable extends Component<DestinationTableProps> {
  render() {
    const { destinations, loading, onEdit, onDelete } = this.props;

    return (
      <section className={PANEL + " overflow-hidden"}>
        {loading ? (
          <div className={HISTORY_EMPTY}>Loading...</div>
        ) : destinations.length === 0 ? (
          <div className={HISTORY_EMPTY}>ไม่พบ destination</div>
        ) : (
          <div className={HISTORY_TABLE_WRAP}>
            <table className={HISTORY_TABLE}>
              <colgroup>
                <col className="w-[50%]" />
                <col className="w-[50%]" />
              </colgroup>
              <thead>
                <tr>
                  <th>Destination</th>
                  <th>แก้ไข</th>
                </tr>
              </thead>
              <tbody>
                {destinations.map((destination, index) => (
                  <tr className={HISTORY_ROW} key={`${destination.id}-${index}`}>
                    <td>{destination.value}</td>
                    <td>
                      <div className="flex justify-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="md"
                          className="min-h-[38px] px-3"
                          onClick={() => onEdit(destination)}
                        >
                          <Pencil size={15} aria-hidden="true" />
                          แก้ไข
                        </Button>
                        <Button
                          type="button"
                          variant="alert"
                          size="md"
                          className="min-h-[38px] px-3"
                          onClick={() => onDelete(destination)}
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
