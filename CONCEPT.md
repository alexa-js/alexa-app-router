# V2 Concept

```
router
  .handle('BeginOrderIntent', beginOrderHandler)
  .handle('OrderStep1Intent', orderStep1Handler)
  .then('GetNameIntent', getNameHandler)
  .handle('OrderStep2Intent', orderStep2Handler);

router
  .on('GetAccountBalanceIntent', getAccountBalanceHandler)
  .route('/collect-payment-method', \
    router
    .collect('ConfirmPaymentFromCard')
  )


router
  .handle('AMAZON.HelpIntent', helpHandler);

router
  .otherwise(helpHandler);
```