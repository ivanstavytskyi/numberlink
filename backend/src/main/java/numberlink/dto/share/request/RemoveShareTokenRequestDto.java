package numberlink.dto.share.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RemoveShareTokenRequestDto {
    @NotBlank
    private String gameToken;
}
