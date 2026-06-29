import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { 
  CreditCard, 
  MapPin, 
  CheckCircle2, 
  Plus, 
  Check, 
  Sparkles,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface Address {
  id: string;
  title: string;
  full_name: string;
  phone: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const { items, getTotals, clearCart } = useCartStore();

  // Checkout Stages: 'address' -> 'payment' -> 'success'
  const [stage, setStage] = useState<'address' | 'payment' | 'success'>('address');

  // Address States
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [addressLoading, setAddressLoading] = useState(true);

  // New Address Form Fields
  const [title, setTitle] = useState('Home');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateField, setStateField] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('US');

  // Payment States
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'razorpay' | 'paypal'>('stripe');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string>('');

  const { subtotal, tax, delivery, total } = getTotals();

  // Load user addresses
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (items.length === 0 && stage !== 'success') {
      navigate('/cart');
      return;
    }

    const fetchAddresses = async () => {
      setAddressLoading(true);
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });
      
      if (!error && data) {
        setAddresses(data as Address[]);
        if (data.length > 0) {
          setSelectedAddressId(data[0].id);
        }
      }
      setAddressLoading(false);
    };

    fetchAddresses();
  }, [user, navigate, items, stage]);

  // Submit new shipping address
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setAddressLoading(true);

    try {
      const newAddr = {
        user_id: user.id,
        title,
        full_name: fullName,
        phone,
        street_address: streetAddress,
        city,
        state: stateField,
        postal_code: postalCode,
        country,
        is_default: addresses.length === 0 // Default if first address
      };

      const { data, error } = await supabase
        .from('addresses')
        .insert(newAddr)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setAddresses([data as Address, ...addresses]);
        setSelectedAddressId(data.id);
        setShowNewAddressForm(false);
        // Clear fields
        setFullName('');
        setPhone('');
        setStreetAddress('');
        setCity('');
        setStateField('');
        setPostalCode('');
      }
    } catch (err) {
      console.error("Error adding address:", err);
    } finally {
      setAddressLoading(false);
    }
  };

  // Mock Payment Processing SDK Wrapper
  // Highly modular - can be replaced with real integrations easily
  const processPaymentGateway = async (method: 'stripe' | 'razorpay' | 'paypal', _amount: number) => {
    return new Promise<{ success: boolean; txId: string }>((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          txId: `tx_${method}_${Math.random().toString(36).substring(2, 14)}`
        });
      }, 2000); // Mock network latency
    });
  };

  // Complete Order Checkout
  const handlePaymentSubmit = async () => {
    if (!user || !selectedAddressId) return;
    setPaymentLoading(true);

    try {
      // 1. Process payment via simulated gateway wrapper
      const payResult = await processPaymentGateway(paymentMethod, total);
      if (!payResult.success) throw new Error("Payment declined by gateway");

      // 2. Create primary order record in Supabase
      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: total,
          tax,
          delivery_charge: delivery,
          address_id: selectedAddressId,
          payment_method: paymentMethod,
          payment_status: 'paid',
          payment_id: payResult.txId,
          status: 'Pending'
        })
        .select()
        .single();

      if (orderErr) throw orderErr;
      const orderId = orderData.id;

      // 3. Create items list mapping to the order
      const orderItemsToInsert = items.map(item => ({
        order_id: orderId,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.product.sale_price ?? item.product.price
      }));

      const { error: itemsErr } = await supabase
        .from('order_items')
        .insert(orderItemsToInsert);

      if (itemsErr) throw itemsErr;

      // 4. Decrease product stock quantities
      for (const item of items) {
        const newStock = Math.max(0, item.product.stock_quantity - item.quantity);
        await supabase
          .from('products')
          .update({ stock_quantity: newStock })
          .eq('id', item.product_id);
      }

      // 5. Clear cart
      await clearCart();

      // 6. Transition to Success
      setCreatedOrderId(orderId);
      setStage('success');
      
      // Fire celebration confetti!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });

    } catch (err) {
      console.error("Order creation failed:", err);
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen pt-28 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col gap-8 relative">
      <div className="bg-mesh"></div>

      {/* STAGE STEP BAR */}
      <div className="flex items-center justify-center gap-4 sm:gap-8 max-w-lg mx-auto w-full mb-4">
        {[
          { label: 'Shipping', key: 'address' },
          { label: 'Payment', key: 'payment' },
          { label: 'Receipt', key: 'success' }
        ].map((step, idx) => {
          const isActive = stage === step.key;
          const isDone = (stage === 'payment' && step.key === 'address') || stage === 'success';

          return (
            <React.Fragment key={step.key}>
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  isDone 
                    ? 'bg-accent-emerald text-black' 
                    : isActive 
                      ? 'bg-accent-purple text-white shadow-neon' 
                      : 'bg-white/5 border border-white/5 text-gray-500'
                }`}>
                  {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                </div>
                <span className={`text-xs font-semibold ${isActive || isDone ? 'text-white' : 'text-gray-500'}`}>
                  {step.label}
                </span>
              </div>
              {idx < 2 && (
                <div className={`h-px flex-grow ${
                  isDone || (stage === 'payment' && idx === 0) ? 'bg-accent-indigo' : 'bg-white/5'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        
        {/* STAGE 1: SHIPPING ADDRESS */}
        {stage === 'address' && (
          <motion.div 
            key="address"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
          >
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              <div className="glass-panel p-6 border border-white/5 shadow-glass flex flex-col gap-4">
                <h2 className="font-bold text-sm text-white flex items-center gap-2">
                  <MapPin className="w-4.5 h-4.5 text-accent-indigo" />
                  Select Shipping Address
                </h2>
                
                {addressLoading ? (
                  <div className="flex justify-center p-6">
                    <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-accent-purple animate-spin"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div 
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`p-4 rounded-xl border cursor-pointer flex gap-3 transition-all relative ${
                          selectedAddressId === addr.id 
                            ? 'border-accent-purple bg-accent-purple/5 shadow-neon' 
                            : 'border-white/5 hover:border-white/10 bg-white/2'
                        }`}
                      >
                        <div className="flex-grow">
                          <p className="text-xs font-bold text-white mb-1.5 flex items-center gap-2">
                            {addr.title}
                            {addr.is_default && (
                              <span className="text-[8px] bg-accent-blue/10 border border-accent-blue/20 text-accent-blue font-bold px-1.5 py-0.5 rounded uppercase">
                                Default
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-300 font-semibold">{addr.full_name}</p>
                          <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                            {addr.street_address}, {addr.city}, {addr.state} - {addr.postal_code}, {addr.country}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-1">Phone: {addr.phone}</p>
                        </div>
                        {selectedAddressId === addr.id && (
                          <div className="w-4 h-4 rounded-full bg-accent-purple flex items-center justify-center absolute top-3 right-3 text-white">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Add Address Card Trigger */}
                    <button 
                      onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                      className="border border-dashed border-white/10 hover:border-white/20 hover:bg-white/5 transition-all p-4 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-white cursor-pointer h-full min-h-36"
                    >
                      <Plus className="w-5 h-5 text-accent-purple" />
                      <span className="text-xs font-semibold">Add New Address</span>
                    </button>
                  </div>
                )}
              </div>

              {/* NEW ADDRESS FORM MODAL/INLINE */}
              {showNewAddressForm && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="glass-panel p-6 border border-white/5 shadow-glass"
                >
                  <h3 className="font-bold text-xs text-white uppercase tracking-wider mb-4">Add Shipping Address</h3>
                  <form onSubmit={handleAddAddress} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Address Title</label>
                      <input 
                        type="text" required placeholder="e.g. Home, Office"
                        value={title} onChange={(e) => setTitle(e.target.value)}
                        className="bg-[#09090D] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-accent-purple/50"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
                      <input 
                        type="text" required placeholder="Full name of recipient"
                        value={fullName} onChange={(e) => setFullName(e.target.value)}
                        className="bg-[#09090D] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-accent-purple/50"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Phone Number</label>
                      <input 
                        type="tel" required placeholder="Contact phone number"
                        value={phone} onChange={(e) => setPhone(e.target.value)}
                        className="bg-[#09090D] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-accent-purple/50"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Street Address</label>
                      <input 
                        type="text" required placeholder="House No, Apartment, Street Name"
                        value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)}
                        className="bg-[#09090D] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-accent-purple/50"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">City</label>
                      <input 
                        type="text" required placeholder="City name"
                        value={city} onChange={(e) => setCity(e.target.value)}
                        className="bg-[#09090D] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-accent-purple/50"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">State / Region</label>
                      <input 
                        type="text" required placeholder="State / Province"
                        value={stateField} onChange={(e) => setStateField(e.target.value)}
                        className="bg-[#09090D] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-accent-purple/50"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Postal Code</label>
                      <input 
                        type="text" required placeholder="ZIP or Pin Code"
                        value={postalCode} onChange={(e) => setPostalCode(e.target.value)}
                        className="bg-[#09090D] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-accent-purple/50"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Country</label>
                      <input 
                        type="text" required placeholder="US, IN, JP etc."
                        value={country} onChange={(e) => setCountry(e.target.value)}
                        className="bg-[#09090D] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-accent-purple/50"
                      />
                    </div>

                    <div className="sm:col-span-2 flex justify-end gap-3 mt-2">
                      <button 
                        type="button" 
                        onClick={() => setShowNewAddressForm(false)}
                        className="px-4 py-2 rounded-lg text-xs font-semibold border border-white/5 bg-white/5 text-gray-400 hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="px-5 py-2 rounded-lg text-xs font-semibold bg-white text-black hover:bg-gray-200 cursor-pointer"
                      >
                        Save Address
                      </button>
                    </div>

                  </form>
                </motion.div>
              )}

            </div>

            {/* ORDER SUMMARY SIDEBAR */}
            <div className="glass-panel p-6 border border-white/5 shadow-glass flex flex-col gap-5">
              <h3 className="font-bold text-sm text-white border-b border-white/5 pb-3">Checkout Details</h3>
              
              <div className="flex flex-col gap-3 text-xs text-gray-400 border-b border-white/5 pb-4 max-h-48 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center gap-2">
                    <span className="truncate max-w-[70%]">{item.product.name} <strong className="text-gray-500 text-[10px]">x{item.quantity}</strong></span>
                    <span className="text-white shrink-0">${((item.product.sale_price ?? item.product.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2.5 text-xs text-gray-400 border-b border-white/5 pb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-white">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes (12%)</span>
                  <span className="text-white">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-white">{delivery === 0 ? 'FREE' : `$${delivery.toFixed(2)}`}</span>
                </div>
              </div>

              <div className="flex justify-between items-baseline mb-2">
                <span className="font-bold text-xs text-white">Grand Total</span>
                <span className="font-black text-lg text-white">${total.toFixed(2)}</span>
              </div>

              <button 
                onClick={() => setStage('payment')}
                disabled={!selectedAddressId}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-accent-indigo via-accent-purple to-accent-blue text-white shadow-neon flex items-center justify-center gap-2 hover:opacity-95 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Proceed to Payment
              </button>
            </div>
          </motion.div>
        )}

        {/* STAGE 2: MOCK PAYMENT WRAPPERS */}
        {stage === 'payment' && (
          <motion.div 
            key="payment"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
          >
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              <div className="glass-panel p-6 border border-white/5 shadow-glass flex flex-col gap-6">
                <h2 className="font-bold text-sm text-white flex items-center gap-2 border-b border-white/5 pb-3">
                  <CreditCard className="w-4.5 h-4.5 text-accent-indigo" />
                  Select Payment Gateway
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { id: 'stripe', name: 'Stripe Gateway', desc: 'Secure debit/credit card engine', color: 'border-accent-purple bg-accent-purple/5' },
                    { id: 'razorpay', name: 'Razorpay Instant', desc: 'Netbanking, UPI, and mobile pay', color: 'border-accent-blue bg-accent-blue/5' },
                    { id: 'paypal', name: 'PayPal Account', desc: 'Global digital wallet ecosystem', color: 'border-yellow-500/20 bg-yellow-500/5' }
                  ].map((gate) => (
                    <div 
                      key={gate.id}
                      onClick={() => setPaymentMethod(gate.id as any)}
                      className={`p-5 rounded-xl border cursor-pointer flex flex-col justify-between transition-all h-32 relative ${
                        paymentMethod === gate.id 
                          ? `${gate.color} border-2 shadow-neon` 
                          : 'border-white/5 hover:border-white/10 bg-white/2'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-white capitalize">{gate.name}</p>
                        <p className="text-[10px] text-gray-500 mt-1">{gate.desc}</p>
                      </div>
                      {paymentMethod === gate.id && (
                        <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center absolute top-3 right-3 text-black">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-white/5 border border-white/5 text-[10px] text-gray-400 mt-2">
                  <Info className="w-4 h-4 text-accent-indigo shrink-0" />
                  <p>Transactions are processed via mock client verification APIs. In future environments, these wrappers instantiate core SDK scripts for Stripe, Razorpay, or PayPal dynamically without modifying this view.</p>
                </div>
              </div>

            </div>

            {/* ORDER REVIEW & PAYMENT TRIGGERS */}
            <div className="glass-panel p-6 border border-white/5 shadow-glass flex flex-col gap-5">
              <h3 className="font-bold text-sm text-white border-b border-white/5 pb-3">Review Order</h3>
              
              <div className="flex flex-col gap-2.5 text-xs text-gray-400 border-b border-white/5 pb-4">
                <div className="flex justify-between">
                  <span>Order Items</span>
                  <span className="text-white">{items.reduce((acc, item) => acc + item.quantity, 0)} items</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Cost</span>
                  <span className="text-white">{delivery === 0 ? 'FREE' : `$${delivery.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between">
                  <span>Grand Total</span>
                  <span className="text-white font-bold text-sm">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Gateway</span>
                  <span className="text-white capitalize font-semibold">{paymentMethod}</span>
                </div>
              </div>

              <button 
                onClick={handlePaymentSubmit}
                disabled={paymentLoading}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-accent-indigo via-accent-purple to-accent-blue text-white shadow-neon flex items-center justify-center gap-2 hover:opacity-95 transition-all cursor-pointer"
              >
                {paymentLoading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                ) : (
                  <>
                    Confirm & Pay ${total.toFixed(2)}
                  </>
                )}
              </button>

              <button 
                onClick={() => setStage('address')}
                disabled={paymentLoading}
                className="text-xs text-gray-500 hover:text-white transition-colors text-center block hover:underline"
              >
                Back to Shipping
              </button>
            </div>
          </motion.div>
        )}

        {/* STAGE 3: ORDER SUCCESS PAGE */}
        {stage === 'success' && (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto w-full glass-panel p-8 text-center border border-white/5 shadow-glass flex flex-col items-center gap-6"
          >
            <div className="w-16 h-16 rounded-full bg-accent-emerald/10 border border-accent-emerald/20 flex items-center justify-center text-accent-emerald shadow-neon">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-black text-gradient flex items-center justify-center gap-1.5">
                <Sparkles className="w-5 h-5 text-accent-purple animate-pulse" />
                Payment Confirmed
              </h2>
              <p className="text-xs text-gray-500">Your order has been logged and queued for shipping</p>
            </div>

            <div className="w-full bg-[#09090D] border border-white/5 rounded-xl p-4 text-xs text-gray-400 text-left flex flex-col gap-2">
              <div className="flex justify-between border-b border-white/5 pb-2 mb-1.5">
                <span>Order Reference</span>
                <span className="text-white font-mono font-bold">{createdOrderId?.substring(0, 18)}...</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Method</span>
                <span className="text-white capitalize">{paymentMethod} Gateway</span>
              </div>
              <div className="flex justify-between">
                <span>Amount Paid</span>
                <span className="text-white font-semibold">${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Delivery</span>
                <span className="text-accent-emerald font-semibold">2 - 3 Business Days</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 w-full">
              <button 
                onClick={() => navigate('/dashboard')}
                className="w-full py-2.5 px-4 rounded-lg font-bold text-xs bg-white text-black hover:bg-gray-200 cursor-pointer shadow-neon"
              >
                Track Order Status
              </button>
              <button 
                onClick={() => navigate('/')}
                className="w-full py-2.5 px-4 rounded-lg font-semibold text-xs border border-white/5 bg-white/5 text-gray-400 hover:text-white cursor-pointer"
              >
                Return to Shop
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};
