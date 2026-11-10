import type { ChangeEvent } from 'react';
import InputERP from '../components/utils/InputERP';

interface ThemePickerProps {
    color: string;
    onChange: (color: string) => void;
    disabled?: boolean;
}

const PRESETS: readonly string[] = [
    '#290c45',
    '#9942f0',
    '#FF00FF',
    '#2563eb',
    '#35b9ac',
    '#006064',
    '#059669',
    '#39FF14',
    '#AEEA00',
    '#dc2626',
    '#9d0101',
    '#881337',
    '#E6B800',
    '#B8860B',
    '#B76E79',
    '#ea580c',
    '#607D8B',
    '#8D6E63',
    '#0f172a',

];

export default function ThemePicker({ color, onChange, disabled = false }: ThemePickerProps) {
    return (
        <div className='grid gap-5'>
            <div className={`flex items-center gap-3 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {PRESETS.map((c) => (
                    <button
                        key={c}
                        type="button"
                        disabled={disabled}
                        onClick={() => onChange(c)}
                        aria-label={`Color ${c}`}
                        className="size-8 rounded-full border-2 transition disabled:cursor-not-allowed"
                        style={{
                            backgroundColor: c,
                            borderColor: c === color ? '#290c45' : 'transparent',
                        }}
                    />
                ))}
            </div>
            <div>
                <InputERP
                    type='color'
                    value={color}
                    onChange={e => onChange(e)}
                />
            </div>
        </div>
    );
}