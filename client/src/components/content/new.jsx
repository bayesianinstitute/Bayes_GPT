import React, { memo } from 'react'
import './style.scss'

const New = memo(() => {
  return (
    <div className='New'>
      <div>
        <h1 className='title currentColor'>Bayes Chat</h1>
      </div>
    </div>
  )
})

export default New