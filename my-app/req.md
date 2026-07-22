# Project Requirement

## Project Overview

สร้าง Web Application สำหรับจัดการ Template และ Export เอกสาร PDF

ระบบนี้ใช้สำหรับลูกค้าแต่ละรายที่มีรูปแบบข้อมูลไม่เหมือนกัน โดยผู้ดูแลระบบสามารถสร้างและแก้ไข Template ได้เอง และผู้ใช้งานสามารถกรอกข้อมูลตาม Template ก่อน Export ออกเป็น PDF

---

# Objectives

- ใช้งานง่าย (Simple UI / UX)
- โหลดเร็ว
- รองรับข้อมูลจำนวนมากได้ดี
- โครงสร้างโค้ดอ่านง่าย
- Clean Code
- Maintainable
- Reusable
- Scalability
- แก้ไขและเพิ่ม Feature ในอนาคตได้ง่าย

---


# Functional Requirements

## 1. Template Management

ระบบต้องรองรับ Template หลายรูปแบบ

ลูกค้าแต่ละรายสามารถใช้ Template คนละแบบได้

Admin สามารถ

- Create Template
- Edit Template
- Delete Template

---

## 2. Dynamic Fields

แต่ละ Template สามารถกำหนด Field ได้เอง

Field แต่ละตัวสามารถกำหนด

- Label
- Key
- Type

เช่น

- Text
- Number
- Date
- Textarea
- Select
- Checkbox

และกำหนดได้ว่า

- Required
- Placeholder
- Default Value
- Validation Rule

ระบบจะสร้าง Form จาก Template โดยอัตโนมัติ

ไม่ต้องเขียน Form ใหม่ทุกครั้ง

---

## 3. Template Structure

Template แบ่งออกเป็น 2 ส่วน

### Inside Box

เป็นข้อมูลหลักของ Template

ลูกค้าแต่ละรายสามารถมี Inside Box ไม่เหมือนกัน

เช่น

- LOT NO. 
- PALLETE NO.
- GROSS
- NESS
- DESTINATION
- CONTRACT NO.

เป็นต้น

---

### Outside Box

เป็นข้อมูลเพิ่มเติม

สามารถเพิ่มได้ตามต้องการ

ไม่จำเป็นต้องเหมือนกันทุก Template

จะมีประมานนี้ 

- TRADE NAME
- S/I NO.
- P/I NO. 
- PRODUCTION DATE 
- UNIT NO.

---

## 4. Data Entry

ผู้ใช้งาน

1. เลือก Template
2. ระบบสร้าง Form ตาม Template
3. กรอกข้อมูล
4. Preview
5. Export PDF

---

## 5. PDF Export

สามารถ Export ได้ทั้ง

- Inside Box
- Outside Box

Layout

- A4
- Landscape
- Grid 2 × 2

เช่น

+-------------+-------------+
|             |             |
|   Card 1    |   Card 2    |
|             |             |
+-------------+-------------+
|             |             |
|   Card 3    |   Card 4    |
|             |             |
+-------------+-------------+

ข้อกำหนด

- Font อ่านง่าย
- ภาษาไทยรองรับ
- Layout ไม่เพี้ยน
- ขนาดเท่ากันทุก Box
- Print Friendly
- PDF Quality สูง

---

# Performance Requirements

ระบบต้องให้ความสำคัญกับ Performance

- โหลดเร็ว
- Response เร็ว
- Query Database อย่างมีประสิทธิภาพ
- รองรับข้อมูลจำนวนมากในอนาคต

แนวทาง

- Pagination
- Database Index
- Query เฉพาะ Column ที่ใช้
- ไม่ใช้ SELECT *
- ลด Re-render
- Reuse Component

---

# Architecture

ใช้ Layered Architecture

```
UI (Pages)

↓

Components

↓

Services

↓

Repositories

↓

mysql2

↓

MySQL
```

---

# Coding Rules

## Pages

Page มีหน้าที่

- Render UI
- เรียก Service

ห้าม

- Query Database
- Business Logic

---

## Route Handlers

มีหน้าที่

- รับ Request
- Validate
- เรียก Service
- Return Response

ห้ามเขียน Logic ทั้งหมดไว้ใน route.ts

---

## Service

Business Logic ทั้งหมด

เช่น

- Create Document
- Update Document
- Export PDF
- Validate Data

---

## Repository

Database Access เท่านั้น

เช่น

- Query
- CRUD
- Search

Service จะเรียก Repository เท่านั้น

---

## Components

ออกแบบให้ Reusable

เช่น

/components

- Button
- Input
- Select
- DatePicker
- FormField
- PDFCard
- Grid
- Modal
- Table

ทุก Component ควรนำกลับมาใช้ซ้ำได้

---

## Validation

ใช้

- React Hook Form
- Zod

Validation ไม่ควรเขียนซ้ำหลายที่

---

# Code Quality

ต้องการ

- Clean Code
- DRY (Don't Repeat Yourself)
- SOLID (เท่าที่เหมาะสม)
- Single Responsibility
- TypeScript Strict
- Strong Typing
- Reusable Logic
- Modular Design

---

# Folder Structure

ออกแบบ Folder Structure ให้รองรับการเพิ่ม Feature

ตัวอย่าง

app/

- components/
- features/
- services/
- repositories/
- hooks/
- lib/
- types/
- constants/

ทุก Folder ต้องมีหน้าที่ชัดเจน

---

# Future Scalability

ระบบต้องสามารถเพิ่ม Feature ได้ง่าย

เช่น

- Login
- Role
- Permission
- History
- Export Excel
- Dashboard
- Report
- API
- Customer Management

โดยไม่ต้องแก้โครงสร้างหลัก

---

# What I Expect

ก่อนเริ่มเขียนโค้ด

ให้ออกแบบ

- System Architecture
- Folder Structure
- Routing
- API Design
- Component Design
- Service Layer
- Repository Layer

เมื่อออกแบบเสร็จแล้ว

ให้สร้างโปรเจกต์ทีละขั้น

โดยอธิบายเหตุผลของการออกแบบแต่ละส่วน

---

# Important

ให้คิดเหมือนเป็น Senior Software Engineer

เน้น

- Performance
- Clean Architecture
- Clean Code
- Reusable Components
- Maintainability
- Scalability
- Readability

ไม่ต้องรีบสร้างโค้ดทั้งหมดทันที

เริ่มจากการออกแบบ Architecture ให้ดีที่สุดก่อน

เมื่อยืนยันแล้วจึงค่อยเริ่มพัฒนาเป็นลำดับขั้น