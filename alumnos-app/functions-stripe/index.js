const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const {createPublicCheckoutHandler} = require("./stripe/createPublicCheckout");
const {createAlumnoCheckoutHandler} = require("./stripe/createAlumnoCheckout");
const {createSubscriptionCheckoutHandler} = require("./stripe/createSubscriptionCheckout");
const {createCustomerPortalHandler} = require("./stripe/createCustomerPortal");
const {stripeWebhookHandler} = require("./stripe/webhook");
const {getInscripcionOrdenHandler} = require("./stripe/getInscripcionOrden");
const {completeInscripcionParte1Handler} = require("./stripe/completeInscripcionParte1");
const {completeInscripcionParte2Handler} = require("./stripe/completeInscripcionParte2");
const {getInscripcionUploadUrlHandler} = require("./stripe/getInscripcionUploadUrl");
const {canjearCodigoDirectoHandler} = require("./stripe/canjearCodigoDirecto");
const {retryClassroomEnrollmentHandler} = require("./stripe/retryClassroomEnrollment");
const {getExpedienteDocsUrlsHandler} = require("./stripe/getExpedienteDocsUrls");
const {getDigitalBookDownloadUrlHandler} = require("./stripe/getDigitalBookDownloadUrl");
const {getCredencialesAlumnoHandler} = require("./stripe/getCredencialesAlumno");
const {verificarCertificadoPublicoHandler} = require("./stripe/verificarCertificadoPublico");

exports.createPublicCheckout = createPublicCheckoutHandler;
exports.createAlumnoCheckout = createAlumnoCheckoutHandler;
exports.createSubscriptionCheckout = createSubscriptionCheckoutHandler;
exports.createCustomerPortal = createCustomerPortalHandler;
exports.stripeWebhook = stripeWebhookHandler;
exports.getInscripcionOrden = getInscripcionOrdenHandler;
exports.completeInscripcionParte1 = completeInscripcionParte1Handler;
exports.completeInscripcionParte2 = completeInscripcionParte2Handler;
exports.getInscripcionUploadUrl = getInscripcionUploadUrlHandler;
exports.canjearCodigoDirecto = canjearCodigoDirectoHandler;
exports.retryClassroomEnrollment = retryClassroomEnrollmentHandler;
exports.getExpedienteDocsUrls = getExpedienteDocsUrlsHandler;
exports.getDigitalBookDownloadUrl = getDigitalBookDownloadUrlHandler;
exports.getCredencialesAlumno = getCredencialesAlumnoHandler;
exports.verificarCertificadoPublico = verificarCertificadoPublicoHandler;
