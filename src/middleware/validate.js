// Uso: validate(miSchemaZod)
export default function validate(schema) {
  return (req, res, next) => {
    const resultado = schema.safeParse(req.body);

    if (!resultado.success) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        detalles: resultado.error.errors,
      });
    }

    req.body = resultado.data;
    next();
  };
}
