// A DummyJSON usa dólar. Ex.: 9.99 vira "US$ 9,99"
export function formatPrice(value) {
  return `US$ ${Number(value).toFixed(2).replace('.', ',')}`;
}