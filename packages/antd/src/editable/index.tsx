import React, { useLayoutEffect, useRef, useState } from 'react'
import { useField, useForm, observer, isVoidField } from '@formily/react'
import { FormPath, isStr } from '@formily/shared'
import { Form, Space, Popover } from 'antd'
import { EditOutlined, CloseOutlined } from '@ant-design/icons'
import { FormItemProps } from 'antd/lib/form'
import { PopoverProps } from 'antd/lib/popover'
import { useClickAway } from '../shared'
import cls from 'classnames'
import './style.less'
/**
 * 默认Inline展示
 */

interface IPopoverProps extends PopoverProps {
  dataIndex?: string
}

type ComposedEditable = React.FC<FormItemProps> & {
  Popover?: React.FC<IPopoverProps>
}

const useEditable = (): [boolean, (payload: boolean) => void] => {
  const form = useForm()
  const field = useField<Formily.Core.Models.Field>()
  useLayoutEffect(() => {
    if (form.pattern === 'editable') {
      if (field.pattern === 'editable') {
        field.setPattern('readPretty')
      }
    }
  }, [])
  return [
    field.pattern === 'editable',
    (pyaload: boolean) => {
      field.setPattern(pyaload ? 'editable' : 'readPretty')
    },
  ]
}

const useFormItemProps = (): FormItemProps => {
  const field = useField()
  if (isVoidField(field)) {
    return {}
  } else {
    return {
      validateStatus: field.validateStatus,
      help: field.errors?.length ? field.errors : field.description,
    }
  }
}

export const Editable: ComposedEditable = observer((props) => {
  const [editable, setEditable] = useEditable()
  const itemProps = useFormItemProps()
  const field = useField<Formily.Core.Models.Field>()
  const ref = useRef<boolean>()
  const innerRef = useRef<HTMLDivElement>()
  const recover = () => {
    if (ref.current && !field?.errors?.length) {
      setEditable(false)
    }
  }
  const renderEditHelper = () => {
    if (editable) return
    return (
      <Form.Item {...itemProps}>
        <EditOutlined className="ant-editable-edit-btn" />
      </Form.Item>
    )
  }

  const renderCloseHelper = () => {
    if (!editable) return
    return (
      <Form.Item>
        <CloseOutlined className="ant-editable-close-btn" />
      </Form.Item>
    )
  }

  useClickAway((e) => {
    const target = e.target as HTMLElement
    if (target?.closest('.ant-select-dropdown')) return
    if (target?.closest('.ant-picker-dropdown')) return
    if (target?.closest('.ant-cascader-menus')) return
    recover()
  }, innerRef)

  const onClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const target = e.target as HTMLElement
    const close = innerRef.current.querySelector('.ant-editable-close-btn')
    if (target?.contains(close) || close?.contains(target)) {
      recover()
    } else if (!ref.current) {
      setTimeout(() => {
        setEditable(true)
        setTimeout(() => {
          innerRef.current.querySelector('input')?.focus()
        })
      })
    }
  }

  ref.current = editable

  return (
    <div className="ant-editable" ref={innerRef} onClick={onClick}>
      <Space>
        <Form.Item {...props} {...itemProps}>
          {props.children}
        </Form.Item>
        {renderEditHelper()}
        {renderCloseHelper()}
      </Space>
    </div>
  )
})

Editable.Popover = observer((props) => {
  const field = useField<Formily.Core.Models.Field>()
  const [editable, setEditable] = useEditable()
  const [visible, setVisible] = useState(false)
  const timer = useRef(null)
  const preview = FormPath.getIn(field.value, props.dataIndex || '')
  const placeholder = isStr(preview) ? preview : ''
  const closePopover = () => {
    const errors = field.form.queryFeedbacks({
      type: 'error',
      address: `*(${field.address},${field.address}.*)`,
    })
    if (errors?.length) return
    setVisible(false)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setEditable(false)
    }, 1000)
  }
  const openPopover = () => {
    clearTimeout(timer.current)
    setEditable(true)
    setVisible(true)
  }
  return (
    <Popover
      {...props}
      title={field.title}
      visible={editable && visible}
      className={cls('ant-editable', props.className)}
      content={props.children}
      trigger="click"
      onVisibleChange={(visible) => {
        if (visible) return
        closePopover()
      }}
    >
      <div
        className="ant-editable"
        onClick={() => {
          openPopover()
        }}
      >
        <Form.Item>
          <Space>
            <span className="ant-editable-preview">
              {placeholder || field.title}
            </span>
            <EditOutlined className="ant-editable-edit-btn" />
          </Space>
        </Form.Item>
      </div>
    </Popover>
  )
})