import { useState } from "react";

export const Box = ({
  instruction,
  type,
  value,
  index,
  handleRemove,
}: {
  instruction: string;
  type: "i32" | "i64" | "f32" | "f64";
  value: number | undefined;
  index: number;
  handleRemove: (index: number) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <span className="wrapper">
      <span>{value}</span>
      <span className="instruction">{instruction}</span>
      <span className={`${type}Box`}>
        <span className={`${type}Type`}>{type}</span>
        {value !== undefined && isEditing ? (
          <input value={value} />
        ) : (
          <span className={`${type}Value`}>{value}</span>
        )}
      </span>
      <span onClick={() => setIsEditing(!isEditing)}>edit</span>
      <span onClick={() => handleRemove(index)}>x</span>
    </span>
  );
};
