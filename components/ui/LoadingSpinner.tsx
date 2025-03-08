import React from 'react';



export const LoadingSpinner = ({ className = '' }) => (

  <div className={`spinner ${className}`}>

    <style jsx>{`

      .spinner {

        border: 4px solid rgba(0, 0, 0, 0.1);

        border-left-color: #000;

        border-radius: 50%;

        width: 24px;

        height: 24px;

        animation: spin 1s linear infinite;

      }

      @keyframes spin {

        to {

          transform: rotate(360deg);

        }

      }

    `}</style>

  </div>

);
