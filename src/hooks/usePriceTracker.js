import { useEffect, useMemo, useState } from "react";

const PRICE_TRACKER_CSV_URL =
  "https://raw.githubusercontent.com/terencicp/supermarket-price-tracker/main/category-avg.csv";

function toNumber(value) {
  if (typeof value !== "string") return null;
  const parsed = Number.parseFloat(value.trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeCategoryName(value) {
  if (!value) return "";
  return value.trim().toLowerCase();
}

function parsePriceCsv(csvText) {
  const rows = csvText
    .split("\n")
    .map((row) => row.trim())
    .filter(Boolean);

  if (rows.length < 2) {
    return null;
  }

  const headerCells = rows[0].split(",").map((cell) => cell.trim());
  if (headerCells.length < 3) {
    return null;
  }

  const storeNames = headerCells.slice(2);
  const categories = {};

  rows.slice(1).forEach((row) => {
    const cells = row.split(",").map((cell) => cell.trim());
    if (cells.length < 3) return;

    const category = normalizeCategoryName(cells[0]);
    if (!category) return;

    const prices = {};
    storeNames.forEach((store, index) => {
      const value = toNumber(cells[index + 2]);
      if (value !== null) {
        prices[store] = value;
      }
    });

    categories[category] = prices;
  });

  return {
    storeNames,
    categories,
  };
}

function buildStoreTotals({ storeNames, categories, shoppingList }) {
  const shippingPrices = categories.shipping || {};

  return storeNames
    .map((store) => {
      const itemsTotal = shoppingList.reduce((total, item) => {
        const category = normalizeCategoryName(item.name);
        const pricePerKg = categories[category]?.[store];
        if (!pricePerKg) return total;
        return total + pricePerKg * item.finalAmountKg;
      }, 0);

      const shipping = shippingPrices[store] || 0;
      const total = itemsTotal + shipping;

      return {
        name: store,
        total,
        shipping,
        itemsTotal,
      };
    })
    .sort((a, b) => a.total - b.total);
}

export function usePriceTracker({ shoppingList }) {
  const [state, setState] = useState({
    isLoading: true,
    error: null,
    raw: null,
  });

  useEffect(() => {
    let isActive = true;

    const loadPrices = async () => {
      try {
        setState({ isLoading: true, error: null, raw: null });
        const response = await fetch(PRICE_TRACKER_CSV_URL);
        if (!response.ok) {
          throw new Error("Failed to fetch price data");
        }

        const text = await response.text();
        const parsed = parsePriceCsv(text);
        if (!parsed) {
          throw new Error("Failed to parse price data");
        }

        if (isActive) {
          setState({ isLoading: false, error: null, raw: parsed });
        }
      } catch (error) {
        if (isActive) {
          setState({
            isLoading: false,
            error,
            raw: null,
          });
        }
      }
    };

    void loadPrices();

    return () => {
      isActive = false;
    };
  }, []);

  const storeTotals = useMemo(() => {
    if (!state.raw || !Array.isArray(shoppingList)) {
      return [];
    }

    return buildStoreTotals({
      storeNames: state.raw.storeNames,
      categories: state.raw.categories,
      shoppingList,
    });
  }, [state.raw, shoppingList]);

  const bestStore = storeTotals.length > 0 ? storeTotals[0] : null;

  return {
    isLoading: state.isLoading,
    error: state.error,
    storeTotals,
    bestStore,
  };
}
