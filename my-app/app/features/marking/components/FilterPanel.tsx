"use client";

import { Component } from "react";
import { STICKER_SIDE_OPTIONS } from "../constants";
import Alert from "@/app/components/Alert";
import Card from "@/app/components/Card";
import Input from "@/app/components/Input";
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
          subtitle="เลือกลูกค้า ระบุน้ำหนัก และจำนวนด้านที่ต้องการติด"
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
          <Input
            label="น้ำหนักรวม (ตัน)"
            type="number"
            min="0"
            step="0.01"
            value={this.state.totalWeight}
            onChange={(event) => this.actions.setTotalWeight(event.target.value)}
            placeholder="0.00"
          />
          <Select
            label="จำนวนด้านสติ๊กเกอร์ต่อกล่อง"
            value={this.state.stickerSides}
            onChange={(event) => this.actions.setStickerSides(event.target.value)}
          >
            {STICKER_SIDE_OPTIONS.map((side) => (
              <option value={side} key={side}>{side} ด้าน</option>
            ))}
          </Select>
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
