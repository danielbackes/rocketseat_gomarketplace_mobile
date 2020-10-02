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
      const saveCart = await AsyncStorage.getItem('@GoMarketPlace:cart');

      if (saveCart) {
        setProducts(JSON.parse(saveCart));
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    async function saveProducts(): Promise<void> {
      await AsyncStorage.setItem(
        '@GoMarketPlace:cart',
        JSON.stringify(products),
      );
    }

    saveProducts();
  }, [products]);

  const addToCart = useCallback(
    async product => {
      const productExistent = products.find(
        (productCart: Product) => product.id === productCart.id,
      );

      if (productExistent) {
        const otherProducts = products.filter(
          (productCart: Product) => product.id !== productCart.id,
        );

        setProducts([
          ...otherProducts,
          { ...productExistent, quantity: productExistent.quantity + 1 },
        ]);
      } else {
        setProducts([...products, { ...product, quantity: 1 }]);
      }
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const product = products.find(
        (productCart: Product) => productCart.id === id,
      );

      if (product) {
        const otherProducts = products.filter(
          (productCart: Product) => productCart.id !== id,
        );

        setProducts([
          ...otherProducts,
          { ...product, quantity: product.quantity + 1 },
        ]);
      }
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const product = products.find(
        (productCart: Product) => productCart.id === id,
      );

      if (product) {
        const otherProducts = products.filter(
          (productCart: Product) => productCart.id !== id,
        );

        if (product.quantity > 1) {
          setProducts([
            ...otherProducts,
            { ...product, quantity: product.quantity - 1 },
          ]);
        } else {
          setProducts([...otherProducts]);
        }
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
