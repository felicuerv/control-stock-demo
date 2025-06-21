import { getDocs, collection } from "firebase/firestore";
import { db } from "../firebase";

export const obtenerCompras = async () => {
  const snapshot = await getDocs(collection(db, "compras"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
