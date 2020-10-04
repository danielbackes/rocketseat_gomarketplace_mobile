import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

export interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storageProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (storageProducts) {
        setProducts([...JSON.parse(storageProducts)]);
      }
    }

    loadProducts();
  }, []);

  async function saveProducts(): Promise<void> {
    await AsyncStorage.setItem(
      '@GoMarketplace:products',
      JSON.stringify(products),
    );
  }

  const addToCart = useCallback(
    async product => {
      const productExists = products.find(
        (cartProduct: Product) => product.id === cartProduct.id,
      );

      if (productExists) {
        setProducts(
          products.map((cartProduct: Product) =>
            cartProduct.id === product.id
              ? { ...cartProduct, quantity: cartProduct.quantity + 1 }
              : cartProduct,
          ),
        );
      } else {
        setProducts([...products, { ...product, quantity: 1 }]);
      }

      saveProducts();
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      setProducts(
        products.map((cartProduct: Product) =>
          cartProduct.id === id
            ? { ...cartProduct, quantity: cartProduct.quantity + 1 }
            : cartProduct,
        ),
      );

      saveProducts();
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const product = products.find(
        (cartProduct: Product) => cartProduct.id === id,
      );

      if (product) {
        if (product.quantity > 1) {
          setProducts(
            products.map((cartProduct: Product) =>
              cartProduct.id === id
                ? {
                    ...cartProduct,
                    quantity: cartProduct.quantity - 1,
                  }
                : cartProduct,
            ),
          );
        } else {
          setProducts(
            products.filter((cartProduct: Product) => cartProduct.id !== id),
          );
        }

        saveProducts();
      }
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
