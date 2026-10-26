// label + input/textarea/select with an optional error message
function Input({ label, error, as = 'input', id, name, className = '', children, ...props }) {
  const inputId = id || name
  const Tag = as
  const classes = ['input']
  if (error) classes.push('input-error')
  if (className) classes.push(className)

  return (
    <div className="form-group">
      {label && <label htmlFor={inputId}>{label}</label>}
      <Tag id={inputId} name={name} className={classes.join(' ')} {...props}>
        {children}
      </Tag>
      {error && <span className="form-error">{error}</span>}
    </div>
  )
}

export default Input
