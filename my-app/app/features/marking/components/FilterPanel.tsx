"use client";

import { Component } from "react";
import {
  STICKER_FORMAT_OPTIONS,
  STICKER_OTHER_OPTIONS,
  STICKER_SIDE_OPTIONS,
  STICKER_TYPE_OPTIONS,
} from "../../../types/constants";
import Alert from "@/app/components/Alert";
import Card from "@/app/components/Card";
import Select from "@/app/components/Select";
import MarkingComponent from "./MarkingComponent";

export default class FilterPanel extends MarkingComponent {
  render() {
    return (
      <main className="container">
        {this.state.notice && (
          <Alert
            type={this.state.notice.type}
            message={this.state.notice.text}
            onClose={() => this.actions.dismissNotice()}
          />
        )}
        <Card className="details-panel">
          <SectionTitle
            number="1"
            title="รายละเอียดสติ๊กเกอร์"
            subtitle="ช่องกรอกจะแสดงตาม Template ที่ Admin กำหนดให้ลูกค้า"
          />
          <div className="detail-grid">
            <Select
              label="ลูกค้า"
              hint={this.state.template ? `Template ภายนอก ${this.state.template.outside.length} ช่องข้อมูล` : undefined}
              value={this.state.customerId}
              onChange={(event) => void this.actions.selectCustomer(event.target.value)}
              disabled={this.state.isLoading}
            >
              <option value="">{this.state.isLoading ? "กำลังโหลดลูกค้า..." : "เลือกลูกค้า"}</option>
              {this.state.customers.map((customer) => (
                <option value={customer.id} key={customer.id}>{customer.name}</option>
              ))}
            </Select>
            {this.state.template?.sticker.enabledFields.includes("side") && (
              <Select label="Side *" value={this.state.stickerSides} onChange={(event) => this.actions.setStickerSides(event.target.value)}>
                <option value="">เลือก Side</option>
                {STICKER_SIDE_OPTIONS.map((side) => <option value={side} key={side}>{side} ด้าน</option>)}
              </Select>
            )}
            {this.state.template?.sticker.enabledFields.includes("format") && (
              <Select label="Format *" hint="จำนวน Pallet ในแต่ละ Lot" value={this.state.stickerFormat} onChange={(event) => this.actions.setStickerFormat(event.target.value)}>
                <option value="">เลือก Format</option>
                {STICKER_FORMAT_OPTIONS.map((format) => <option value={format} key={format}>{format === "5533" ? "5533 — [5, 5, 3, 3]" : "555 — [5, 5, 5]"}</option>)}
              </Select>
            )}
            {this.state.template?.sticker.enabledFields.includes("type") && (
              <Select label="Type *" value={this.state.stickerType} onChange={(event) => this.actions.setStickerType(event.target.value)}>
                <option value="">เลือก Type</option>
                {STICKER_TYPE_OPTIONS.map((type) => <option value={type} key={type}>{type}</option>)}
              </Select>
            )}
            {this.state.template?.sticker.enabledFields.includes("other") && (
              <Select label="Other *" value={this.state.stickerOther} onChange={(event) => this.actions.setStickerOther(event.target.value)}>
                <option value="">เลือก Other</option>
                {STICKER_OTHER_OPTIONS.map((other) => <option value={other} key={other}>{other}</option>)}
              </Select>
            )}
          </div>
        </Card>
      </main>
    );
  }
}

interface SectionTitleProps {
  number: string;
  title: string;
  subtitle: string;
}

export class SectionTitle extends Component<SectionTitleProps> {
  render() {
    const { number, title, subtitle } = this.props;
    return (
      <div className="section-title">
        <div>
          <span>{number}</span>
          <div><h2>{title}</h2><p>{subtitle}</p></div>
        </div>
      </div>
    );
  }
}
