import { useState } from "react";

export const Box = ({
  instruction,
  type,
  value,
  index,
  handleChange,
  handleRemove,
}: {
  instruction: string;
  value: number | undefined;
  index: number;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemove: (index: number) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <span className="wrapper">
      <span className="instruction">{instruction}</span>
      <span className={`${type}Box`}>
        {value !== undefined && isEditing ? (
          <input
            value={value}
            onChange={handleChange}
            onBlur={() => setIsEditing(false)}
          />
        ) : (
          <span className={`${type}Value`}>{value}</span>
        )}
      </span>
      {value !== undefined && (
        <span onClick={() => setIsEditing(!isEditing)}>edit</span>
      )}
      <span onClick={() => handleRemove(index)}>x</span>
    </span>
  );
};
