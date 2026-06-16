                          <h3 className="font-bold text-gray-800 text-2xl flex items-center gap-3">
                            <ShoppingCart className="text-orange-500" size={28} />
                            سلة المشتريات الذكية
                          </h3>
                          <button onClick={() => setIsCartOpen(false)} className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 shadow-sm transition-colors border border-gray-100">
                            <X size={24} />
                          </button>
                        </div>

                        <div className="max-h-[50vh] overflow-y-auto p-8 space-y-4">
                          {cart.length > 0 ? cart.map(item => (
                            <div key={item.id} className="flex justify-between items-center bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                              <div className="flex items-center gap-6">
                                <span className="text-4xl bg-orange-50 text-orange-500 w-16 h-16 flex items-center justify-center rounded-2xl group-hover:scale-110 transition-transform">{item.icon}</span>
                                <div>
                                  <p className="font-bold text-gray-800 text-lg mb-1">{item.name}</p>
                                  <p className="text-sm font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-lg inline-block">الكمية المحددة: {item.cartQuantity}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-6">
                                <p className="font-bold text-orange-500 text-xl tabular-nums">{item.price * item.cartQuantity} <span className="text-sm text-gray-400">ر.س</span></p>
                                <button onClick={() => setCart(cart.filter(c => c.id !== item.id))} className="text-gray-400 hover:text-rose-500 hover:bg-rose-50 p-3 rounded-2xl transition-colors">
                                  <Trash2 size={20} />
                                </button>
                              </div>
                            </div>
                          )) : (
                            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                              <ShoppingCart size={64} className="mb-6 opacity-20" />
                              <p className="font-bold text-xl text-gray-500">السلة فارغة حالياً!</p>
                              <p className="text-sm mt-2">تصفح قائمة الطعام وأضف ما تشتهيه.</p>
                            </div>
                          )}
                        </div>

                        <div className="p-8 border-t border-gray-100 bg-gray-50/50">
                          <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-3xl border border-gray-100">
                            <p className="text-lg text-gray-600 font-bold">الإجمالي المطلوب</p>
                            <p className="text-4xl font-bold text-gray-900 tabular-nums">
                              {cart.reduce((total, item) => total + (item.price * item.cartQuantity), 0)} <span className="text-lg text-gray-400">ر.س</span>
                            </p>
                          </div>
                          <button
                            onClick={handleCheckout}
                            disabled={cart.length === 0}
                            className={`w-full text-white py-5 rounded-2xl font-bold text-xl transition-transform flex items-center justify-center gap-3 ${cart.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'btn-oversized bg-gradient-to-r from-primary to-emerald-500 hover:-translate-y-1 shadow-[0_15px_30px_rgba(0,108,53,0.3)]'}`}
                          >
                            <CreditCard size={24} />
                            إتمام الطلب
                          </button>
                        </div>
                      </>
                    )}

                    {checkoutStatus === 'confirming' && (
                      <div className="p-16 text-center animate-fade-in">
                        <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                          <ShoppingCart size={40} />
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-4">تأكيد عملية الشراء</h3>
                        <p className="text-gray-500 font-medium mb-8 text-lg">
                          سيتم خصم <span className="font-bold text-primary">{cart.reduce((total, item) => total + (item.price * item.cartQuantity), 0)} ر.س</span> من محفظتك الإلكترونية.
                        </p>
                        <div className="flex gap-4 max-w-sm mx-auto">
                          <button onClick={confirmPurchase} className="flex-1 bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/30 hover:-translate-y-1 transition-transform">
                            تأكيد الدفع
                          </button>
                          <button onClick={() => setCheckoutStatus('idle')} className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-colors">
                            إلغاء
                          </button>
                        </div>
                      </div>
                    )}\n                  </motion.div>
                </div>
              )}
            </>
          )}

          <div className="flex-1 flex overflow-hidden">
            {!hideStudentUI && (
              <Sidebar
                activeNav={currentPage}
                setActiveNav={(nav) => { setCurrentPage(nav); setIsSidebarOpen(false); }}
                onLogoutClick={() => setCurrentPage('landing')}
                studentData={student}
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
              />
            )}

            <main className={`flex-1 overflow-y-auto bg-slate-50 relative ${!hideStudentUI ? 'p-4 md:p-8' : ''}`}>
              <div className="max-w-7xl mx-auto space-y-8">
                {(() => {
                  if (currentPage === 'dashboard') {
                    return <StudentDashboard studentData={student} setCurrentPage={setCurrentPage} studentBalance={studentBalance} />;
                  }
                  if (currentPage === 'cafeteria') {
                    return <CafeteriaView studentData={student} cart={cart} setCart={setCart} searchQuery={searchQuery} studentBalance={studentBalance} />;
                  }
                  if (currentPage === 'leaderboard') {
                    return <LeaderboardView studentData={student} />;