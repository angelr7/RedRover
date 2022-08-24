// TODO: create types

const validateRequest = (requestBody: string) => {
  if (typeof requestBody !== "object")
    console.log("Request body must be an object!");
};
