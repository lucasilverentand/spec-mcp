# Business Requirement Interview Process

This document describes the interview process for creating a Business Requirement entity.

## Overview

A Business Requirement entity represents a business need or goal. It includes business value, stakeholders, user stories, and acceptance criteria from a business perspective.

## Interview Stages

### Stage 1: Main Questions

These questions gather the core information about the business requirement:

#### Q-001: Title/Name
**Question:** What is the title/name of this business requirement?

**Example Answer:** "Multi-language Support for Application"

---

#### Q-002: Description
**Question:** Provide a detailed description of this business requirement.

**Example Answer:** "Add support for multiple languages (English, Spanish, French, German) to expand our market reach into European countries. This includes UI translations, content localization, and regional formatting for dates, times, and currencies."

---

### Stage 2: Array Fields

After answering the main questions, you'll be asked about collection fields.

#### Business Value Collection

**Collection Question:** List the business values this requirement delivers (comma-separated descriptions, e.g., 'increased revenue', 'improved customer satisfaction')

**Example Answer:** "Expanded market reach, Increased revenue potential, Better user experience for international customers"

For each business value listed, you'll answer:

1. **What type of business value is this?**
   - Options: revenue, cost-savings, customer-satisfaction, other
   - Example: "revenue"

2. **Describe the business value, ROI, or benefit**
   - Example: "Opens up European market with estimated 200K potential users, projected to increase annual revenue by $500K-$1M"

---

#### Stakeholders Collection

**Collection Question:** List the key stakeholders (comma-separated names or roles, e.g., 'Product Owner', 'Engineering Lead')

**Example Answer:** "Sarah Chen, Michael Rodriguez, International Sales Team"

For each stakeholder listed, you'll answer:

1. **What is the stakeholder's role?**
   - Options: product-owner, business-analyst, project-manager, customer, end-user, executive, developer, other
   - Example: "product-owner"

2. **What is the stakeholder's name?**
   - Example: "Sarah Chen"

3. **What is the stakeholder's interest in this requirement?**
   - Example: "Responsible for international expansion strategy and market penetration in European markets"

4. **What is the stakeholder's email? (optional)**
   - Example: "sarah.chen@company.com"

---

#### User Stories Collection

**Collection Question:** List the user stories (comma-separated brief descriptions, e.g., 'user can login', 'admin can view reports')

**Example Answer:** "User can switch language, User sees localized content, User sees correct date format"

For each user story listed, you'll answer:

1. **As a [role]...**
   - Example: "As an international user"

2. **I want [feature]...**
   - Example: "I want to switch the application language to my preferred language"

3. **So that [benefit]...**
   - Example: "So that I can use the application comfortably in my native language"

---

#### Criteria Collection (Acceptance Criteria)

**Collection Question:** List the acceptance criteria (comma-separated descriptions, e.g., 'user receives confirmation email', 'response time under 200ms')

**Example Answer:** "Language selector visible in header, All UI elements translated, Date formats match locale, Currency displays correctly"

For each criterion listed, you'll answer:

1. **Describe this acceptance criterion in detail**
   - Example: "A language selector dropdown must be visible in the application header on all pages, allowing users to choose from English, Spanish, French, and German. The selection must persist across sessions."

---

### Stage 3: Finalization

After all questions are answered and all array items are finalized, the system will generate the complete Business Requirement entity with:
- Computed fields (type, number, slug)
- Status tracking (created_at, updated_at, completed, verified)
- All business value items
- All stakeholders
- All user stories
- All acceptance criteria
- All provided data structured according to the Business Requirement schema

## Tips

1. **Business Value**: Focus on measurable outcomes (revenue, costs, satisfaction metrics)
2. **Stakeholders**: Include all parties with significant interest or influence
3. **User Stories**: Follow the "As a... I want... So that..." format
4. **Acceptance Criteria**: Be specific and testable
5. **Quantify When Possible**: Include numbers, percentages, timeframes
6. **Business Focus**: Keep technical details minimal - save those for technical requirements

## Example Full Interview

**Title:** "Real-time Order Tracking for Customers"

**Description:** "Enable customers to track their orders in real-time from placement to delivery, including status updates, estimated delivery times, and delivery driver location."

**Business Values:** "Reduced support tickets, Improved customer satisfaction, Competitive advantage"

For each value:
1. "Reduced support tickets" - cost-savings - "Expected to reduce 'Where is my order?' support inquiries by 40%, saving approximately $50K annually in support costs"
2. "Improved customer satisfaction" - customer-satisfaction - "Customer surveys show 85% of users want real-time tracking; expected to increase NPS score by 10-15 points"
3. "Competitive advantage" - other - "Main competitors don't offer real-time tracking; differentiates our service in the market"

**Stakeholders:** "Lisa Wang, Tom Anderson, Customer Support Team"

For each:
1. Lisa Wang - product-owner - "Lisa Wang" - "Owns customer experience initiatives and tracking metrics" - "lisa.wang@company.com"
2. Tom Anderson - executive - "Tom Anderson" - "CEO interested in competitive positioning and customer satisfaction" - "tom.anderson@company.com"
3. Customer Support Team - other - "Customer Support Team" - "Will benefit from reduced tracking-related inquiries" - "support@company.com"

**User Stories:** "Track order status, See delivery ETA, View driver location"

For each:
1. "As a customer" - "I want to see the current status of my order" - "So that I know when to expect delivery and can plan accordingly"
2. "As a customer" - "I want to see an estimated delivery time" - "So that I can be available to receive my order"
3. "As a customer" - "I want to see my delivery driver's location on a map" - "So that I know exactly when they will arrive"

**Criteria:** "Order status updates in real-time, ETA accuracy within 15 minutes, Map view shows driver location"

For each:
1. "Order status must update in real-time (within 30 seconds) when status changes occur (order placed, preparing, out for delivery, delivered). Updates must be visible on both web and mobile apps without requiring page refresh."
2. "Estimated delivery time must be displayed and updated dynamically based on current traffic and driver location. ETA accuracy must be within 15 minutes for 90% of deliveries."
3. "When order is out for delivery, customers must see driver location on an interactive map, updating every 10-30 seconds, showing route and current position."
