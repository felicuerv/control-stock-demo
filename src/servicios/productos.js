// src/servicios/productos.js
import { getDocs, collection } from "firebase/firestore";
import { db } from "../firebase";

export const obtenerProductos = async () => {
  const snapshot = await getDocs(collection(db, "productos"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
