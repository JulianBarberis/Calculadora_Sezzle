import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { App } from '../App'

describe('Phase 0 Frontend Smoke Suite', () => {
  it('renders application under React.StrictMode without errors or act warnings', () => {
    render(
      <StrictMode>
        <App />
      </StrictMode>
    )

    // Heading and branding verification
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/sezzle/i)
    expect(screen.getByText(/fintech/i)).toBeInTheDocument()

    // Semantic output verification
    const output = screen.getByTestId('calculator-display')
    expect(output).toBeInTheDocument()

    // Keypad button verification
    expect(screen.getByRole('button', { name: 'Calcular resultado' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Borrar todo' })).toBeInTheDocument()
  })

  it('preserves deterministic mounting across 10 StrictMode double invocations', () => {
    for (let i = 0; i < 10; i++) {
      const { unmount } = render(
        <StrictMode>
          <App />
        </StrictMode>
      )
      expect(screen.getByText(/precisión arbitraria/i)).toBeInTheDocument()
      unmount()
    }
  })
})
