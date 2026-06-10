import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiHeart, FiMapPin } from 'react-icons/fi'

export default function ProductCard({ product }) {
  const [liked, setLiked] = useState(false)

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      overflow: 'hidden',
      border: '2px solid #f0f0f0',
      transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
      cursor: 'pointer',
      position: 'relative',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(212,240,96,0.2)'
        e.currentTarget.style.borderColor = '#D4F060'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.borderColor = '#f0f0f0'
      }}
    >
      {/* Badge condición */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        background: product.condition === 'Nuevo' ? '#D4F060' : '#F5F5F5',
        color: '#0d0d0d',
        fontSize: '0.7rem',
        fontWeight: 700,
        padding: '3px 10px',
        borderRadius: '50px',
        fontFamily: "'Syne', sans-serif",
        zIndex: 1,
      }}>
        {product.condition}
      </div>

      {/* Botón favorito */}
      <button
        onClick={e => { e.preventDefault(); setLiked(!liked) }}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '34px',
          height: '34px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 1,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          color: liked ? '#ff4d6d' : '#aaa',
          fontSize: '1rem',
          transition: 'transform 0.15s, color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <FiHeart fill={liked ? '#ff4d6d' : 'none'} />
      </button>

      {/* Imagen */}
      <Link to={`/product/${product.id}`} style={{ textDecoration: 'none' }}>
        <div style={{ width: '100%', height: '180px', background: '#f7f7f7', overflow: 'hidden' }}>
          <img
            src={product.image || 'https://via.placeholder.com/300x180?text=Sin+imagen'}
            alt={product.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
            onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
          />
        </div>

        {/* Info */}
        <div style={{ padding: '14px' }}>
          <p style={{
            margin: '0 0 6px',
            fontSize: '0.95rem',
            fontWeight: 600,
            color: '#0d0d0d',
            fontFamily: "'DM Sans', sans-serif",
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {product.title}
          </p>

          <p style={{
            margin: '0 0 10px',
            fontSize: '1.2rem',
            fontWeight: 800,
            color: '#0d0d0d',
            fontFamily: "'Syne', sans-serif",
          }}>
            {product.price} €
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: '#888',
            fontSize: '0.78rem',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            <FiMapPin size={12} />
            {product.location || 'Sin ubicación'}
          </div>
        </div>
      </Link>
    </div>
  )
}