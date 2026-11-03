function Card({ title, actions, className = '', children }) {
  return (
    <div className={`card ${className}`}>
      {(title || actions) && (
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
          {title && <h3 className="card-title" style={{ margin: 0 }}>{title}</h3>}
          {actions}
        </div>
      )}
      {children}
    </div>
  )
}

export default Card
