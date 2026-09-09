import type { Template } from "@/src/core/models/template";

/**
 * Turns the template list into the strings the autocomplete shows and maps a
 * typed string back to a template id. TemplateAutocomplete used to own all of this.
 */
export default class TemplateOptions {
  static label(template: Template) {
    return template.isActive === false ? `[Inactive] ${template.name}` : template.name;
  }

  static selectable(templates: Template[], includeInactive = false) {
    return includeInactive ? templates : templates.filter((template) => template.isActive !== false);
  }

  static options(templates: Template[], includeInactive = false) {
    return this.selectable(templates, includeInactive).map((template) => this.label(template));
  }

  static labelFor(templates: Template[], templateId: string) {
    const template = templates.find((item) => String(item.id) === templateId);
    return template ? this.label(template) : "";
  }

  /** Accepts the displayed label, the bare name, or the id itself. */
  static idForQuery(templates: Template[], query: string, includeInactive = false) {
    const normalized = query.trim().toLowerCase();
    const template = this.selectable(templates, includeInactive).find((item) =>
      this.label(item).trim().toLowerCase() === normalized ||
      item.name.trim().toLowerCase() === normalized ||
      String(item.id) === query.trim(),
    );
    return template ? String(template.id) : "";
  }
}
