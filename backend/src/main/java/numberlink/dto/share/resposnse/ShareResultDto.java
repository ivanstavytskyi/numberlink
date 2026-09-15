package numberlink.dto.share.resposnse;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ShareResultDto {
    private String player;
    private int points;
    private int elapsedSeconds;
    private int fieldWidth;
    private int fieldHeight;
    private int hints;
    private String access;
    private UUID shareToken;
}
