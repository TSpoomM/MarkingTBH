import { Component, type ChangeEvent } from "react";
import type { AutocompleteProps } from "@/src/core/models/ui";

interface AutocompleteState {
  open: boolean;
  activeIndex: number;
}

export default class Autocomplete extends Component<AutocompleteProps, AutocompleteState> {
  private static nextGeneratedId = 0;

  private generatedId: string;

  constructor(props: AutocompleteProps) {
    super(props);
    Autocomplete.nextGeneratedId += 1;
    this.generatedId = `autocomplete-${Autocomplete.nextGeneratedId}`;
  }

  state: AutocompleteState = {
    open: false,
    activeIndex: -1,
  };

  private value() {
    return String(this.props.value ?? "");
  }

  private filteredOptions(options: string[]) {
    const value = this.value().trim().toLowerCase();
    const uniqueOptions = Array.from(new Set(options.filter(Boolean)));
    if (!value) return uniqueOptions.slice(0, 8);
    return uniqueOptions
      .filter((option) => option.toLowerCase().includes(value))
      .slice(0, 8);
  }

  private selectOption(option: string) {
    const { onChange } = this.props;
    const event = {
      target: { value: option },
      currentTarget: { value: option },
    } as ChangeEvent<HTMLInputElement>;
    onChange?.(event);
    this.setState({ open: false, activeIndex: -1 });
  }

  render() {
    const {
      label,
      hint,
      options,
      bare = false,
      required,
      className = "",
      onChange,
      onFocus,
      onBlur,
      onKeyDown,
      ...props
    } = this.props;
    const filteredOptions = this.filteredOptions(options);
    const hasOptions = filteredOptions.length > 0;
    const listId = `${props.id ?? this.generatedId}-options`;
    const control = (
      <div className="autocomplete-shell">
        <input
          required={required}
          className={`app-control autocomplete-input ${className}`.trim()}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={this.state.open && hasOptions}
          aria-controls={listId}
          onChange={(event) => {
            onChange?.(event);
            this.setState({ open: true, activeIndex: -1 });
          }}
          onFocus={(event) => {
            onFocus?.(event);
            this.setState({ open: true });
          }}
          onBlur={(event) => {
            onBlur?.(event);
            window.setTimeout(() => this.setState({ open: false, activeIndex: -1 }), 120);
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (!hasOptions) return;
            if (event.key === "ArrowDown") {
              event.preventDefault();
              this.setState((current) => ({
                open: true,
                activeIndex: Math.min(current.activeIndex + 1, filteredOptions.length - 1),
              }));
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              this.setState((current) => ({
                open: true,
                activeIndex: Math.max(current.activeIndex - 1, 0),
              }));
            }
            if (event.key === "Enter" && this.state.open && this.state.activeIndex >= 0) {
              event.preventDefault();
              this.selectOption(filteredOptions[this.state.activeIndex]);
            }
            if (event.key === "Escape") {
              this.setState({ open: false, activeIndex: -1 });
            }
          }}
          {...props}
        />
        {this.state.open && hasOptions && (
          <div className="autocomplete-list" id={listId} role="listbox">
            {filteredOptions.map((option, index) => (
              <button
                type="button"
                className={index === this.state.activeIndex ? "active" : ""}
                role="option"
                aria-selected={index === this.state.activeIndex}
                onMouseDown={(event) => {
                  event.preventDefault();
                  this.selectOption(option);
                }}
                key={option}
              >
                <span>{option}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
    if (bare || !label) return control;
    return (
      <label className="field">
        <span>{label}{required && <em>*</em>}</span>
        {control}
        <small className="field-hint" aria-hidden={!hint}>{hint || " "}</small>
      </label>
    );
  }
}
