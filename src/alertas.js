// alertas.js
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export const generarAlertas = async () => {
  const alertas = [];

  // Productos con bajo stock y sin proveedor
  const productosRef = collection(db, "productos");
  const snapshot = await getDocs(productosRef);

  const nombres = {};
  const codigos = {};

  snapshot.forEach((doc) => {
    const prod = doc.data();

    // Bajo stock
    if (prod.stock < prod.stockMinimo) {
      alertas.push(`⚠️ El producto "${prod.nombre}" tiene bajo stock (${prod.stock} unidades).`);
    }

    // Sin proveedor
    if (!prod.proveedorNombre) {
      alertas.push(`⚠️ El producto "${prod.nombre}" no tiene proveedor asignado.`);
    }

    // Recolección para detección de duplicados
    const nombreKey = prod.nombre?.trim().toLowerCase();
    const codigoKey = prod.codigo?.trim().toLowerCase();

    if (nombreKey) nombres[nombreKey] = (nombres[nombreKey] || 0) + 1;
    if (codigoKey) codigos[codigoKey] = (codigos[codigoKey] || 0) + 1;
  });

  // Alerta por nombres duplicados
  Object.entries(nombres).forEach(([nombre, count]) => {
    if (count > 1) {
      alertas.push(`⚠️ Hay ${count} productos con el nombre duplicado: "${nombre}".`);
    }
  });

  // Alerta por códigos duplicados
  Object.entries(codigos).forEach(([codigo, count]) => {
    if (count > 1) {
      alertas.push(`⚠️ Hay ${count} productos con el código duplicado: "${codigo}".`);
    }
  });

  // Servicios con errores
  const serviciosSnapshot = await getDocs(collection(db, "servicios"));
  serviciosSnapshot.forEach((doc) => {
    const s = doc.data();
    if (!s.fechaFinalizacion) {
      alertas.push(`⚠️ El servicio para "${s.cliente}" no tiene fecha de finalización.`);
    }
    if (s.importe <= 0) {
      alertas.push(`⚠️ El servicio de "${s.cliente}" tiene un importe inválido.`);
    }
  });

  return alertas;
};



