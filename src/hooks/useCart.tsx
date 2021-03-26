import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });
  const addProduct = async (productId: number) => {
    try {

      const stock = await api.get<Stock>(`/stock/${productId}`);
      const { amount } = stock.data;
      const productExist = cart.find(product => product.id === productId)
      console.log(cart);
      if (productExist) {
        if (amount > productExist.amount) {
          productExist.amount++;

          setCart([...cart]);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart]));
        } else {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
      } else {
        const products = await api.get<Product>(`/products/${productId}`);
        let product = products.data;
        product.amount = 1;

        if (amount >= product.amount) {
          setCart([...cart, product]);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, product]));
        } else {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
      }
    } catch {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExist = cart.find(product => product.id === productId);
      if (!productExist) {
        throw ('');
      }
      const products = cart.filter(product => product.id !== productId);
      setCart(products);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(products));
    } catch {
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) return;
      const stock = await api.get<Stock>(`/stock/${productId}`);
      const { amount: amountData } = stock.data;
      const productExist = cart.find(product => product.id === productId);
      if (productExist) {
        if (amountData >= amount) {
          productExist.amount = amount;
          setCart([...cart]);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart]));
        } else {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
      } else {
        throw('');
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
