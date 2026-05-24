const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const {createPublicCheckoutHandler} = require("./stripe/createPublicCheckout");
const {createAlumnoCheckoutHandler} = require("./stripe/createAlumnoCheckout");
const {createSubscriptionCheckoutHandler} = require("./stripe/createSubscriptionCheckout");
const {createCustomerPortalHandler} = require("./stripe/createCustomerPortal");
const {stripeWebhookHandler} = require("./stripe/webhook");

exports.createPublicCheckout = createPublicCheckoutHandler;
exports.createAlumnoCheckout = createAlumnoCheckoutHandler;
exports.createSubscriptionCheckout = createSubscriptionCheckoutHandler;
exports.createCustomerPortal = createCustomerPortalHandler;
exports.stripeWebhook = stripeWebhookHandler;
