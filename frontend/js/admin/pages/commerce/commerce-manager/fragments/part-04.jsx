                          : undefined
                    }
                    defaultValue={editingCommerce?.stock_limit || 0}
                  />
                  <small className="field-hint">
                    سقف واردشده نمی‌تواند بیشتر از موجودی محصول باشد.
                  </small>
                </div>
                <JalaliDateTimePicker
                  name="starts_at"
                  label="تاریخ و ساعت شروع (جلالی)"
                  value={editingCommerce?.starts_at || new Date()}
                  required
                />
                <JalaliDateTimePicker
                  name="ends_at"
                  label="تاریخ و ساعت پایان (جلالی)"
                  value={
                    editingCommerce?.ends_at || new Date(Date.now() + 86400000)
                  }
                  required
                />
              </div>
            )}
            <div className="save-row">
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setCreateModal(false);
                  setEditingCommerce(null);
                }}
              >
                انصراف
              </button>
              <button className="primary">ذخیره</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
