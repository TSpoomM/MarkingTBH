"use client";

import Toast from "@/src/components/ui/Toast";
import Card from "@/src/components/ui/Card";
import Input from "@/src/components/ui/Input";
import TemplateAutocomplete from "@/src/components/templates/TemplateAutocomplete";
import MarkingComponent from "./MarkingComponent";
import SectionTitle from "./SectionTitle";

export default class FilterPanel extends MarkingComponent {
  render() {
    return (
      <main className="container">
        {this.state.notice && (
          <Toast
            type={this.state.notice.type}
            message={this.state.notice.text}
            onClose={() => this.actions.dismissNotice()}
          />
        )}
        <Card className="details-panel">
          <SectionTitle
            number="1"
            title="รายละเอียดสติ๊กเกอร์"
            subtitle="เลือก Template และกรอกข้อมูลการผลิต ส่วนค่า Sticker ถูกกำหนดโดย Admin"
          />
          <div className="detail-grid">
            <TemplateAutocomplete
              label="Template"
              hint={this.state.template ? `สติ๊กเกอร์นอกกรอบมี ${this.state.template.outside.length} ช่องข้อมูล` : undefined}
              selectedTemplateId={this.state.templateId}
              templates={this.state.templates}
              placeholder={this.state.isLoading ? "กำลังโหลด Template..." : "เลือก Template"}
              onSelectTemplate={(templateId) => void this.actions.selectTemplate(templateId)}
              disabled={this.state.isLoading}
            />
            <Input
              label="Production Date *"
              type="date"
              value={this.state.productionDate}
              onChange={(event) => this.actions.setProductionDate(event.target.value)}
            />
            <Input
              label="จำนวน Lot ที่ต้องการ print *"
              hint={`เริ่ม LOT ${this.state.lotStart}`}
              type="number"
              min="1"
              value={this.state.lotCount}
              onChange={(event) => this.actions.setLotCount(event.target.value)}
            />
          </div>
        </Card>
      </main>
    );
  }
}
