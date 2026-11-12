import test from 'node:test';
import assert from 'node:assert/strict';
import { obtenerDocumentosPorNivel as documentos, obtenerOpcionesCertificado as qr } from '../src/utils/opcionesCertificado.js';
const origin = 'https://alumnos.certificacionmontessori.com';
const alumno = {id:'alumno-prueba',estado:'Activo',nivel:'Taller',niveles:[{id:'casa',nombre:'Casa de Niños',estado:'completado'},{id:'taller',nombre:'Taller',estado:'completado'}]};
test('dos niveles completados muestran dos certificados aunque la cuenta esté activa',()=>{
 const docs=documentos(alumno,origin);
 assert.deepEqual(docs.map(d=>d.label),['Certificado de Casa de Niños','Certificado de Taller']);
 assert.deepEqual(docs.map(d=>d.url),qr(alumno,origin).map(d=>d.url));
 assert.deepEqual(docs.map(d=>new URL(d.url).searchParams.get('nivel')),['casa','taller']);
});
test('nivel completado y en curso se distinguen sin duplicar enlaces generales',()=>{
 const docs=documentos({...alumno,niveles:[alumno.niveles[0],{...alumno.niveles[1],estado:'activo'}]},origin);
 assert.deepEqual(docs.map(d=>d.tipo),['Certificado','Constancia']);
 assert.equal(new URL(docs[1].url).searchParams.get('tipo'),'constancia');
});
test('estado desconocido no acredita graduación',()=>{
 assert.equal(documentos({...alumno,niveles:[{id:'casa',nombre:'Casa de Niños',estado:'baja'}]},origin)[0].tipo,'Constancia');
});
test('graduado legado solo completa el nivel vigente, no los demás',()=>{
 const docs=documentos({...alumno,estado:'Graduado',niveles:alumno.niveles.map(n=>({...n,estado:'activo'}))},origin);
 assert.deepEqual(docs.map(d=>d.tipo),['Constancia','Certificado']);
});
test('sin historial conserva URL general y tipo correcto',()=>{
 assert.equal(documentos({id:'legacy',estado:'Graduado',nivel:'Casa'},origin)[0].url,`${origin}/certificado/legacy`);
 assert.equal(documentos({id:'legacy',estado:'Activo',nivel:'Casa'},origin)[0].url,`${origin}/certificado/legacy?tipo=constancia`);
});
test('sin alumno o cuenta inactiva no expone documentos',()=>{
 assert.deepEqual(documentos(null,origin),[]);
 assert.deepEqual(documentos({...alumno,estado:'Inactivo'},origin),[]);
});
test('historial incompleto y duplicados no rompen los enlaces',()=>{
 const docs=documentos({...alumno,niveles:[null,alumno.niveles[0],alumno.niveles[0]]},origin);
 assert.equal(docs.length,2);
 assert.equal(docs[1].label,'Constancia de Taller');
});
