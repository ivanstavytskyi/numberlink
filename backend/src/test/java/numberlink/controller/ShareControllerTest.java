package numberlink.controller;

import numberlink.dto.share.resposnse.ShareResultDto;
import numberlink.exceptions.RestExceptionHandler;
import numberlink.exceptions.ShareAccessDeniedException;
import numberlink.exceptions.ShareResultNotFoundException;
import numberlink.service.share.ShareService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ShareControllerTest {

    @Mock private ShareService shareService;
    @InjectMocks private ShareController shareController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(shareController)
                .setControllerAdvice(new RestExceptionHandler())
                .build();
    }

    @Test
    void searchByToken_returnsSharedResult() throws Exception {
        when(shareService.findSharedResult("42dad145-f830-440f-a00e-5706902a7f14"))
                .thenReturn(new ShareResultDto("vasiliki_collins", 556, 18, 7, 7, 0, "private", null));

        mockMvc.perform(get("/api/search/42dad145-f830-440f-a00e-5706902a7f14"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.player").value("vasiliki_collins"))
                .andExpect(jsonPath("$.points").value(556))
                .andExpect(jsonPath("$.elapsedSeconds").value(18))
                .andExpect(jsonPath("$.access").value("private"));
    }

    @Test
    void searchByToken_whenMissing_returns404() throws Exception {
        when(shareService.findSharedResult("11111111-1111-1111-1111-111111111111"))
                .thenThrow(new ShareResultNotFoundException());

        mockMvc.perform(get("/api/search/11111111-1111-1111-1111-111111111111"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Results not found"));
    }

    @Test
    void searchByToken_whenPrivateAndForbidden_returns403() throws Exception {
        when(shareService.findSharedResult("42dad145-f830-440f-a00e-5706902a7f14"))
                .thenThrow(new ShareAccessDeniedException());

        mockMvc.perform(get("/api/search/42dad145-f830-440f-a00e-5706902a7f14"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("This result is private"));
    }
}
