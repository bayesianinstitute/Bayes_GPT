import React, { memo } from 'react'
import { useDispatch } from 'react-redux'
import { Sun, Thunder, Warning } from '../../assets'
import { livePrompt } from '../../redux/messages'
import './style.scss'

const New = memo(() => {
  const dispatch = useDispatch()
  return (
    <div className='New'>
      <div>
        <h1 className='title currentColor'>Bayes E-commerce Chat</h1>
      </div>
    </div>
  )
})

export default New