import { validarCPF } from './cpfValidator';

describe('validarCPF', () => {
  it('should return true for a valid CPF', () => {
    // Example of a valid CPF (you might want to use real valid CPFs for more robust testing)
    expect(validarCPF('111.444.777-35')).toBe(true);
    expect(validarCPF('000.000.000-00')).toBe(false); // All digits equal is invalid
    expect(validarCPF('123.456.789-00')).toBe(false); // Invalid verification digits
    expect(validarCPF('12345678900')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-10')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-01')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-02')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-03')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-04')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-05')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-06')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-07')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-08')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-10')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-11')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-12')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-13')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-14')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-15')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-16')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-17')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-18')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-19')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-20')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-21')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-22')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-23')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-24')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-25')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-26')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-27')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-28')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-29')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-30')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-31')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-32')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-33')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-34')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-35')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-36')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-37')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-38')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-39')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-40')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-41')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-42')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-43')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-44')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-45')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-46')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-47')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-48')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-49')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-50')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-51')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-52')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-53')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-54')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-55')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-56')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-57')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-58')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-59')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-60')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-61')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-62')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-63')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-64')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-65')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-66')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-67')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-68')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-69')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-70')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-71')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-72')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-73')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-74')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-75')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-76')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-77')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-78')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-79')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-80')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-81')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-82')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-83')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-84')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-85')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-86')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-87')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-88')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-89')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-90')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-91')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-92')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-93')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-94')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-95')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-96')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-97')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-98')).toBe(false); // Invalid verification digits
    expect(validarCPF('123.456.789-99')).toBe(false); // Invalid verification digits
  });

  it('should return false for a CPF with incorrect length', () => {
    expect(validarCPF('123.456.789-0')).toBe(false); // Too short
    expect(validarCPF('123.456.789-000')).toBe(false); // Too long
    expect(validarCPF('1234567890')).toBe(false); // Missing one digit
  });

  it('should return false for a CPF with all digits equal', () => {
    expect(validarCPF('111.111.111-11')).toBe(false);
    expect(validarCPF('222.222.222-22')).toBe(false);
    expect(validarCPF('999.999.999-99')).toBe(false);
  });

  it('should return false for a CPF with invalid verification digits', () => {
    // CPF with correct format but incorrect verification digits
    expect(validarCPF('123.456.789-01')).toBe(false);
    expect(validarCPF('987.654.321-01')).toBe(false);
  });

  it('should handle CPF with or without formatting', () => {
    // A valid CPF without formatting
    expect(validarCPF('11144477735')).toBe(true);
    // A valid CPF with formatting
    expect(validarCPF('111.444.777-35')).toBe(true);
  });
});
