import React, { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export const useCart = () => {
  return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);

  const calculateTotal = () => {
    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setTotal(totalAmount.toFixed(2)); // Calcul du total
  };

  const addToCart = (item) => {
    setCart((prevCart) => {
      const updatedCart = [...prevCart, item];
      calculateTotal(updatedCart);
      return updatedCart;
    });
  };

  const removeFromCart = (itemId) => {
    setCart((prevCart) => {
      const updatedCart = prevCart.filter(item => item.id !== itemId);
      calculateTotal(updatedCart);
      return updatedCart;
    });
  };

  return (
    <CartContext.Provider value={{ cart, total, addToCart, removeFromCart }}>
      {children}
    </CartContext.Provider>
  );
};
