/**
 * Tests for ProjectForm field components
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  FormField,
  DateField,
  NumberField,
  SelectField
} from '../fields';

describe('FormField', () => {
  it('should render input field with label', () => {
    render(
      <FormField
        label="Test Field"
        name="test"
        value=""
        onChange={() => {}}
      />
    );

    expect(screen.getByText('Test Field')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should render required indicator when required prop is true', () => {
    render(
      <FormField
        label="Required Field"
        name="test"
        value=""
        onChange={() => {}}
        required
      />
    );

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('should call onChange when input value changes', () => {
    const onChange = jest.fn();
    render(
      <FormField
        label="Test"
        name="test"
        value=""
        onChange={onChange}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new value' } });

    expect(onChange).toHaveBeenCalled();
  });

  it('should disable input when disabled prop is true', () => {
    render(
      <FormField
        label="Test"
        name="test"
        value=""
        onChange={() => {}}
        disabled
      />
    );

    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});

describe('DateField', () => {
  it('should render date input field', () => {
    render(
      <DateField
        label="Date"
        name="date"
        value=""
        onChange={() => {}}
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'date');
  });

  it('should display date value', () => {
    render(
      <DateField
        label="Date"
        name="date"
        value="2024-01-15"
        onChange={() => {}}
      />
    );

    expect(screen.getByDisplayValue('2024-01-15')).toBeInTheDocument();
  });
});

describe('NumberField', () => {
  it('should render number input field', () => {
    render(
      <NumberField
        label="Capacity"
        name="capacity"
        value=""
        onChange={() => {}}
      />
    );

    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('type', 'number');
  });

  it('should respect min and step attributes', () => {
    render(
      <NumberField
        label="Capacity"
        name="capacity"
        value=""
        onChange={() => {}}
        min={0}
        step={0.1}
      />
    );

    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('step', '0.1');
  });
});

describe('SelectField', () => {
  const options = [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' }
  ];

  it('should render select field with options', () => {
    render(
      <SelectField
        label="Select"
        name="select"
        value=""
        onChange={() => {}}
        options={options}
      />
    );

    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('should show loading text when loading prop is true', () => {
    render(
      <SelectField
        label="Select"
        name="select"
        value=""
        onChange={() => {}}
        options={options}
        loading
        loadingText="Loading options..."
      />
    );

    expect(screen.getByText('Loading options...')).toBeInTheDocument();
  });

  it('should disable select when loading', () => {
    render(
      <SelectField
        label="Select"
        name="select"
        value=""
        onChange={() => {}}
        options={options}
        loading
      />
    );

    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('should call onChange when selection changes', () => {
    const onChange = jest.fn();
    render(
      <SelectField
        label="Select"
        name="select"
        value="1"
        onChange={onChange}
        options={options}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '2' } });

    expect(onChange).toHaveBeenCalled();
  });
});
