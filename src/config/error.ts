export const error_message = (error: any) => {
  switch (error?.code) {
    case "EREQUEST":
      return {
        status: false,
        message: error?.message,
      };
    default:
      return { status: false, message: error.message || error };
  }
};
