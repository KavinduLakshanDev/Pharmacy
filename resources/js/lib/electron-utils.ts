export const isElectron = (): boolean => {
  return typeof window !== 'undefined' && (window as any).electron !== undefined;
};

export const getElectron = () => {
  return (window as any).electron;
};

export const printInElectron = async (html: string, printerName?: string) => {
  if (isElectron()) {
    try {
      const result = await getElectron().printReceipt({ html, printerName });
      return result;
    } catch (error) {
      console.error('Electron printing failed:', error);
      throw error;
    }
  }
  return null;
};
export const getElectronPrinters = async () => {
  if (isElectron()) {
    try {
      return await getElectron().getPrinters();
    } catch (error) {
      console.error('Failed to fetch printers:', error);
      return [];
    }
  }
  return [];
};
